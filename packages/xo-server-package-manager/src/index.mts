import type { PluginRestRouteDefinition, XoApp } from '@vates/types'
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

// routes without `acl` middleware are restricted to administrators
const REST_ROUTES: PluginRestRouteDefinition[] = [
  {
    method: 'get',
    endpoint: 'plugins/package-manager/updates',
    description: 'List the upgradable packages of the XO appliance, from the local package indexes',
    tags: ['package-manager'],
    callback: getUpdates,
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

class PackageManagerPlugin {
  readonly #xo: XoApp
  #unregisterRestRoutes: (() => void) | undefined

  constructor(xo: XoApp) {
    this.#xo = xo
  }

  async load(): Promise<void> {
    await checkAptAvailable()
    this.#unregisterRestRoutes = this.#xo.registerRestRoutes(REST_ROUTES)
    log.info('plugin loaded')
  }

  unload(): void {
    this.#unregisterRestRoutes?.()
    this.#unregisterRestRoutes = undefined
  }
}

export default function pluginFactory({ xo }: { xo: XoApp }): PackageManagerPlugin {
  return new PackageManagerPlugin(xo)
}
