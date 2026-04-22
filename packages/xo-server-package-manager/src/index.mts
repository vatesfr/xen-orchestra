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

// --- Plugin class ---
class PackageManagerPlugin {
  readonly #xo: XoApp
  readonly #getDataDir: () => Promise<string>
  #configuration: PackageManagerConfiguration | undefined
  #unregisterApiMethods: (() => void) | undefined
  #undefineAppMethods: (() => void) | undefined

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

    log.info('Plugin loaded')
  }

  async unload() {
    this.#unregisterApiMethods?.()
    this.#unregisterApiMethods = undefined
    this.#undefineAppMethods?.()
    this.#undefineAppMethods = undefined
    log.info('Plugin unloaded')
  }
}

// --- Factory (default export) ---
export default function packageManagerPluginFactory(opts: { xo: XoApp; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
