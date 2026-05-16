import { createLogger } from '@xen-orchestra/log'
import { AptPackageManager } from './apt.mjs'
import type { PackageManagerConfiguration } from './types.mjs'
import type { XoApp } from '@vates/types'

const log = createLogger('xo:xo-server-package-manager')

// --- Configuration schema (empty for now, prepared for future options) ---
export const configurationSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
}

// Minimal request shape used by route callbacks — only the properties we access
type RouteCtx = {
  req: {
    params: Readonly<Record<string, string | undefined>>
    body: unknown
  }
}

// --- Plugin class ---
class PackageManagerPlugin {
  readonly #xo: XoApp
  readonly #getDataDir: () => Promise<string>
  #configuration: PackageManagerConfiguration | undefined
  #unregisterApiMethods: (() => void) | undefined
  #undefineAppMethods: (() => void) | undefined
  #unregisterRestRoutes: (() => void) | undefined

  constructor({ xo, getDataDir }: { xo: XoApp; getDataDir: () => Promise<string> }) {
    this.#xo = xo
    this.#getDataDir = getDataDir
  }

  configure(configuration: PackageManagerConfiguration) {
    this.#configuration = configuration
  }

  async load() {
    const dataDir = await this.#getDataDir()
    const systemPackageManager = new AptPackageManager(dataDir)
    systemPackageManager.checkAvailable()

    // Recover interrupted operations from a previous crash
    const stale = await systemPackageManager.cleanupStaleOperation()
    if (stale !== undefined) {
      log.warn('Cleaned up interrupted package operation', {
        operation: stale.operation,
        pid: stale.pid,
        startedAt: new Date(stale.startedAt).toISOString(),
      })
    }

    // Register API methods
    const updatePackageList = () => systemPackageManager.updatePackageList()
    updatePackageList.permission = 'admin'
    updatePackageList.description = 'Refresh the local package index (apt-get update)'

    const listUpgradable = () => systemPackageManager.listUpgradable()
    listUpgradable.permission = 'admin'
    listUpgradable.description = 'List upgradable system packages from local cache'

    const upgrade = ({ packages }: { packages?: string[] }) => systemPackageManager.upgrade(packages)
    upgrade.permission = 'admin'
    upgrade.description = 'Upgrade system packages'
    upgrade.params = {
      packages: { type: 'array', items: { type: 'string' }, optional: true },
    }

    const systemUpgrade = () => systemPackageManager.systemUpgrade()
    systemUpgrade.permission = 'admin'
    systemUpgrade.description = 'Perform a full distribution upgrade'

    const getOperationStatus = () => systemPackageManager.getOperationStatus()
    getOperationStatus.permission = 'admin'
    getOperationStatus.description = 'Get status of running package operation'

    this.#unregisterApiMethods = this.#xo.addApiMethods({
      packageManager: {
        listUpgradable,
        upgrade,
        systemUpgrade,
        getOperationStatus,
      },
    })

    this.#undefineAppMethods = this.#xo.defineProperties({
      listUpgradablePackages: () => systemPackageManager.listUpgradable(),
      updatePackageList: () => systemPackageManager.updatePackageList(),
      upgradePackages: (packages?: string[]) => systemPackageManager.upgrade(packages),
      systemUpgradePackages: () => systemPackageManager.systemUpgrade(),
      getPackageOperationStatus: () => systemPackageManager.getOperationStatus(),
    })

    this.#unregisterRestRoutes = this.#xo.registerRestRoutes(
      [
        {
          method: 'get',
          endpoint: '/updates',
          description: 'List upgradable system packages from local cache',
          tags: ['xoa'],
          callback: async (_ctx: RouteCtx) => ({
            packages: await systemPackageManager.listUpgradable(),
            isRebootRequired: systemPackageManager.isRebootRequired(),
          }),
        },
        {
          method: 'post',
          endpoint: '/updates/refresh',
          description: 'Run apt-get update and return the updated list of upgradable packages',
          tags: ['xoa'],
          callback: async (_ctx: RouteCtx) => {
            await systemPackageManager.updatePackageList()
            return {
              packages: await systemPackageManager.listUpgradable(),
              isRebootRequired: systemPackageManager.isRebootRequired(),
            }
          },
        },
        {
          method: 'post',
          endpoint: '/updates/upgrade',
          description: 'Upgrade all upgradable packages, or a specific subset via JSON body',
          tags: ['xoa'],
          middlewares: [{ name: 'json' }],
          callback: async ({ req }: RouteCtx) => {
            const body = req.body as Record<string, unknown> | null | undefined
            const packages =
              body !== null && body !== undefined && Array.isArray(body['packages'])
                ? (body['packages'] as string[])
                : undefined
            const { packagesUpgraded, requiredAction } = await systemPackageManager.upgrade(packages)
            return { packagesUpgraded, requiredAction }
          },
        },
        {
          method: 'post',
          endpoint: '/updates/packages/{name}/upgrade',
          description: 'Upgrade a specific system package by name',
          tags: ['xoa'],
          params: { name: { type: 'string' } },
          callback: async ({ req }: RouteCtx) => {
            const name = req.params['name']
            if (name === undefined) {
              throw new Error('Package name is required')
            }
            const { packagesUpgraded, requiredAction } = await systemPackageManager.upgrade([name])
            return { packagesUpgraded, requiredAction }
          },
        },
        {
          method: 'post',
          endpoint: '/updates/dist-upgrade',
          description: 'Perform a full distribution upgrade (apt-get dist-upgrade)',
          tags: ['xoa'],
          callback: async (_ctx: RouteCtx) => {
            const { packagesUpgraded, requiredAction } = await systemPackageManager.systemUpgrade()
            return { packagesUpgraded, requiredAction }
          },
        },
        {
          method: 'get',
          endpoint: '/updates/operation',
          description: 'Get the status of the current or last package operation',
          tags: ['xoa'],
          callback: (_ctx: RouteCtx) => systemPackageManager.getOperationStatus(),
        },
      ],
      '/xoa'
    )

    log.info('Plugin loaded')
  }

  async unload() {
    this.#unregisterApiMethods?.()
    this.#unregisterApiMethods = undefined
    this.#undefineAppMethods?.()
    this.#undefineAppMethods = undefined
    this.#unregisterRestRoutes?.()
    this.#unregisterRestRoutes = undefined
    log.info('Plugin unloaded')
  }
}

// --- Factory (default export) ---
export default function packageManagerPluginFactory(opts: { xo: XoApp; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
