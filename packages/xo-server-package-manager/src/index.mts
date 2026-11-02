import type {
  DebianRelease,
  DistributionUpgrade,
  DistributionUpgradeRun,
  PluginRestRouteDefinition,
  XoApp,
  XoTask,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import {
  checkAptAvailable,
  isRebootRequired,
  isValidPackageName,
  listUpgradablePackages,
  refreshPackageIndexes,
  upgradePackages,
} from './apt.mjs'
import { getDistributionUpgrade, readInstalledRelease } from './distribution.mjs'
import {
  acknowledgeDistributionUpgradeEnd,
  checkDistributionUpgrade,
  getDistributionUpgradeToCheck,
  markDistributionUpgradeChecked,
  readLastDistributionUpgrade,
  startDistributionUpgrade,
  waitForDistributionUpgradeEnd,
} from './dist-upgrade.mjs'

const log = createLogger('xo:xo-server-package-manager')

async function getDistributionUpgradeOrWarn(targetVersionId: unknown): Promise<DistributionUpgrade | undefined> {
  try {
    return getDistributionUpgrade({ installedRelease: await readInstalledRelease(), targetVersionId })
  } catch (error) {
    // a wrong target must not hide the package updates
    log.warn('failed to compute the distribution upgrade', { error, targetVersionId })
    return undefined
  }
}

async function readLastDistributionUpgradeOrWarn(stateFile: string): Promise<DistributionUpgradeRun | undefined> {
  try {
    return await readLastDistributionUpgrade(stateFile)
  } catch (error) {
    log.warn('failed to read the last distribution upgrade', { error, stateFile })
    return undefined
  }
}

const formatRelease = ({ versionId, codename }: DebianRelease) => `Debian ${versionId} (${codename})`

// the end of a task is saved asynchronously, it must be saved before xo-server is restarted
async function waitForTaskSaved(xo: XoApp, taskId: string): Promise<void> {
  for (let i = 0; i < 50; i++) {
    // same ID, typed `vates-task` on the task and `task` in the store
    const taskLog = await xo.tasks.get(taskId as XoTask['id']).catch(() => undefined) // not saved yet
    if (taskLog !== undefined && taskLog.status !== 'pending') {
      return
    }
    await setTimeout(100)
  }
  log.warn('the end of the distribution upgrade task has not been saved', { taskId })
}

/**
 * Report the progress of the upgrade in an XO task and end it before the script restarts xo-server
 */
async function followDistributionUpgrade({
  xo,
  distributionUpgrade: { from, to },
  stateFile,
}: {
  readonly xo: XoApp
  readonly distributionUpgrade: DistributionUpgrade
  readonly stateFile: string
}): Promise<string> {
  const task = xo.tasks.create({
    name: `upgrade of the XO appliance from ${formatRelease(from)} to ${formatRelease(to)}`,
    type: 'xo:package-manager:distribution-upgrade',
  })

  const follow = async () => {
    let step: string | undefined
    let progress: number | undefined
    const run = await task.runInside(() =>
      waitForDistributionUpgradeEnd({
        stateFile,
        onRunning: run => {
          if (run.step !== step) {
            step = run.step
            task.set('step', step)
          }
          if (run.progress !== undefined && run.progress !== progress) {
            progress = run.progress
            task.set('progress', progress)
          }
        },
      })
    )
    if (run.status === 'success') {
      task.success(run)
    } else {
      task.failure(Object.assign(new Error(`distribution upgrade ${run.status} at step ${run.step}`), run))
    }
  }

  void (async () => {
    try {
      await follow()
    } catch (error) {
      // the task has been ended by `runInside`
      log.warn('failed to follow the distribution upgrade', { error, stateFile })
    }
    await waitForTaskSaved(xo, task.id)
    await acknowledgeDistributionUpgradeEnd(stateFile)
  })().catch(error => log.warn('failed to acknowledge the end of the distribution upgrade', { error, stateFile }))

  return task.id
}

/**
 * After a restart by the upgrade, report the state of the system in an XO task, for the user and the support
 */
async function checkLastDistributionUpgrade({
  xo,
  stateFile,
}: {
  readonly xo: XoApp
  readonly stateFile: string
}): Promise<void> {
  const run = await getDistributionUpgradeToCheck(stateFile)
  if (run === undefined) {
    return
  }

  const task = xo.tasks.create({
    name: `check of the XO appliance after its upgrade to ${formatRelease(run.to)}`,
    type: 'xo:package-manager:distribution-upgrade-check',
  })
  try {
    await task.run(() => checkDistributionUpgrade(run))
  } finally {
    await markDistributionUpgradeChecked({ run, stateFile })
  }
}

// routes without `acl` middleware are restricted to administrators
const createRestRoutes = ({
  xo,
  targetVersionId,
  distributionUpgradeStateFile,
}: {
  readonly xo: XoApp
  readonly targetVersionId: unknown
  readonly distributionUpgradeStateFile: string
}): PluginRestRouteDefinition[] => [
  {
    method: 'get',
    endpoint: 'plugins/package-manager/updates',
    description:
      'List the upgradable packages of the XO appliance, from the local package indexes, the next Debian release if validated by Vates and the last release upgrade',
    tags: ['package-manager'],
    callback: async () => {
      const lastDistributionUpgrade = await readLastDistributionUpgradeOrWarn(distributionUpgradeStateFile)
      // apt reads are not locked: they would list the packages of a half-upgraded system
      if (lastDistributionUpgrade?.status === 'running') {
        return { packages: [], isRebootRequired: false, distributionUpgrade: undefined, lastDistributionUpgrade }
      }

      const [packages, rebootRequired, distributionUpgrade] = await Promise.all([
        listUpgradablePackages(),
        isRebootRequired(),
        getDistributionUpgradeOrWarn(targetVersionId),
      ])
      return { packages, isRebootRequired: rebootRequired, distributionUpgrade, lastDistributionUpgrade }
    },
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/actions/upgrade-distribution',
    description:
      'Upgrade the XO appliance to the next Debian release, restarts xo-server at the end. Returns 202 with a task ID',
    tags: ['package-manager'],
    callback: async ({ res }) => {
      const distributionUpgrade = getDistributionUpgrade({
        installedRelease: await readInstalledRelease(),
        targetVersionId,
      })
      if (distributionUpgrade === undefined) {
        incorrectState({ object: 'distribution', property: 'nextRelease', actual: undefined, expected: 'validated' })
      }
      await startDistributionUpgrade({ distributionUpgrade, stateFile: distributionUpgradeStateFile })
      const taskId = await followDistributionUpgrade({
        xo,
        distributionUpgrade,
        stateFile: distributionUpgradeStateFile,
      })
      // same response as `createAction`
      res.status(202).set('Location', `/rest/v0/tasks/${taskId}`)
      return { taskId }
    },
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/actions/refresh',
    description: 'Refresh the package indexes (`apt-get update`)',
    tags: ['package-manager'],
    callback: async () => {
      await refreshPackageIndexes()
    },
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/actions/upgrade',
    description: 'Upgrade all packages. Returns 202 with a task ID',
    tags: ['package-manager'],
    callback: ({ createAction }) =>
      createAction(task => upgradePackages({ onProgress: percentage => task.set('progress', percentage) }), {
        taskProperties: { name: 'upgrade packages' },
      }),
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/{name}/actions/upgrade',
    description: 'Upgrade one package. Returns 202 with a task ID',
    tags: ['package-manager'],
    params: { name: { type: 'string', example: 'curl' } },
    callback: ({ req, createAction }) => {
      const packageName = req.params.name
      if (typeof packageName !== 'string' || !isValidPackageName(packageName)) {
        throw invalidParameters(`invalid package name: ${packageName}`)
      }
      return createAction(
        task => upgradePackages({ packageName, onProgress: percentage => task.set('progress', percentage) }),
        { taskProperties: { name: `upgrade package ${packageName}` } }
      )
    },
  },
]

// same cadence as Debian's apt-daily timer
const REFRESH_INTERVAL = 12 * 60 * 60e3

async function refreshInBackground(): Promise<void> {
  try {
    await refreshPackageIndexes()
  } catch (error) {
    log.warn('failed to refresh the package indexes', { error })
  }
}

class PackageManagerPlugin {
  readonly #xo: XoApp
  readonly #getDataDir: () => Promise<string>
  #refreshInterval: NodeJS.Timeout | undefined
  #unregisterRestRoutes: (() => void) | undefined

  constructor({ xo, getDataDir }: { readonly xo: XoApp; readonly getDataDir: () => Promise<string> }) {
    this.#xo = xo
    this.#getDataDir = getDataDir
  }

  async load(): Promise<void> {
    await checkAptAvailable()
    // Debian `VERSION_ID` validated by Vates, shipped in the xo-server config of the XOA build
    const targetVersionId = this.#xo.config.getOptional('xoa.targetDistribution')
    const distributionUpgradeStateFile = join(await this.#getDataDir(), 'dist-upgrade.json')
    this.#unregisterRestRoutes = this.#xo.registerRestRoutes(
      createRestRoutes({ xo: this.#xo, targetVersionId, distributionUpgradeStateFile })
    )

    checkLastDistributionUpgrade({ xo: this.#xo, stateFile: distributionUpgradeStateFile }).catch(error =>
      log.warn('failed to check the last distribution upgrade', { error })
    )

    // without it, the upgradable packages are listed from stale indexes
    void refreshInBackground()
    this.#refreshInterval = setInterval(refreshInBackground, REFRESH_INTERVAL)
    this.#refreshInterval.unref()

    log.info('plugin loaded')
  }

  unload(): void {
    clearInterval(this.#refreshInterval)
    this.#refreshInterval = undefined
    this.#unregisterRestRoutes?.()
    this.#unregisterRestRoutes = undefined
  }
}

export default function pluginFactory({
  xo,
  getDataDir,
}: {
  xo: XoApp
  getDataDir: () => Promise<string>
}): PackageManagerPlugin {
  return new PackageManagerPlugin({ xo, getDataDir })
}
