import type { PluginRestRouteDefinition, XoApp } from '@vates/types'
import type { VatesTask } from '@vates/types/lib/vates/task'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters } from 'xo-common/api-errors.js'
import {
  checkAptAvailable,
  isRebootRequired,
  isValidPackageName,
  listUpgradablePackages,
  refreshPackageIndexes,
  upgradePackages,
} from './apt.mjs'

const log = createLogger('xo:xo-server-package-manager')

async function getUpdates() {
  const [packages, rebootRequired] = await Promise.all([listUpgradablePackages(), isRebootRequired()])
  return { packages, isRebootRequired: rebootRequired }
}

// apt runs dpkg several times during an upgrade: these statuses are not about a package
const DPKG_ITEM = 'dpkg-exec'

/**
 * Upgrade in `task`, which gets the steps of the installation of each package as infos, and what apt reports as
 * failed as warnings
 */
function upgradeInTask(task: VatesTask, packageName?: string): Promise<void> {
  return upgradePackages({
    packageName,
    onProgress: percentage => task.set('progress', percentage),
    onStatus: ({ phase, item, message, isError }) => {
      // the download only repeats `Retrieving file 3 of 4`
      if (phase !== 'install' || item === DPKG_ITEM) {
        return
      }
      if (isError) {
        task.warning(message, undefined)
      } else {
        task.info(message, undefined)
      }
    },
  })
}

const UPGRADE_STARTED_RESPONSE = {
  status: 202,
  description: 'Upgrade started, follow it with the returned task',
  schema: { taskId: { type: 'string', example: '0mhx2k3qf7a' } },
} satisfies NonNullable<PluginRestRouteDefinition['responses']>[number]

// routes without `acl` middleware are restricted to administrators
const REST_ROUTES: PluginRestRouteDefinition[] = [
  {
    method: 'get',
    endpoint: 'plugins/package-manager/updates',
    description: 'List the upgradable packages of the XO appliance, from the local package indexes',
    tags: ['package-manager'],
    responses: [
      {
        status: 200,
        description: 'The upgradable packages, and whether an already upgraded package needs a reboot',
        schema: {
          packages: {
            type: 'array',
            items: {
              type: 'object',
              fields: {
                name: { type: 'string', example: 'curl' },
                version: { type: 'string', example: '7.88.1-10+deb12u14' },
                installedVersion: { type: 'string', example: '7.88.1-10+deb12u12' },
                release: { type: 'string', example: 'stable-security' },
                description: { type: 'string', example: 'command line tool for transferring data with URL syntax' },
              },
            },
          },
          isRebootRequired: { type: 'boolean', example: false },
        },
      },
    ],
    callback: getUpdates,
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/actions/refresh',
    description: 'Refresh the package indexes (`apt-get update`)',
    tags: ['package-manager'],
    responses: [{ status: 204, description: 'Package indexes refreshed' }],
    callback: async () => {
      await refreshPackageIndexes()
    },
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/actions/upgrade',
    description: 'Upgrade all packages. Returns 202 with a task ID',
    tags: ['package-manager'],
    responses: [UPGRADE_STARTED_RESPONSE],
    callback: ({ createAction }) =>
      createAction(task => upgradeInTask(task), { taskProperties: { name: 'upgrade packages' } }),
  },
  {
    method: 'post',
    endpoint: 'plugins/package-manager/updates/{name}/actions/upgrade',
    description: 'Upgrade one package. Returns 202 with a task ID',
    tags: ['package-manager'],
    params: { name: { type: 'string', example: 'curl' } },
    responses: [UPGRADE_STARTED_RESPONSE, { status: 422, description: 'Invalid package name' }],
    callback: ({ req, createAction }) => {
      const packageName = req.params.name
      if (typeof packageName !== 'string' || !isValidPackageName(packageName)) {
        throw invalidParameters(`invalid package name: ${packageName}`)
      }
      return createAction(task => upgradeInTask(task, packageName), {
        taskProperties: { name: `upgrade package ${packageName}` },
      })
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
  #refreshInterval: NodeJS.Timeout | undefined
  #unregisterRestRoutes: (() => void) | undefined

  constructor(xo: XoApp) {
    this.#xo = xo
  }

  async load(): Promise<void> {
    await checkAptAvailable()
    this.#unregisterRestRoutes = this.#xo.registerRestRoutes(REST_ROUTES)

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

export default function pluginFactory({ xo }: { xo: XoApp }): PackageManagerPlugin {
  return new PackageManagerPlugin(xo)
}
