import { createLogger } from '@xen-orchestra/log'
import { AptPackageManager } from './apt.mjs'
import type { PackageManagerConfiguration } from './types.mjs'

const log = createLogger('xo:xo-server-package-manager')

// --- Configuration schema (empty for now, prepared for future options) ---
export const configurationSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
}

// --- Plugin class ---
class PackageManagerPlugin {
  readonly #xo: any
  readonly #getDataDir: () => Promise<string>
  #apt: AptPackageManager | undefined
  #configuration: PackageManagerConfiguration | undefined
  #unregisterApiMethods: (() => void) | undefined

  constructor({ xo, getDataDir }: { xo: any; getDataDir: () => Promise<string> }) {
    this.#xo = xo
    this.#getDataDir = getDataDir
  }

  configure(configuration: PackageManagerConfiguration) {
    this.#configuration = configuration
  }

  async load() {
    const dataDir = await this.#getDataDir()
    const apt = new AptPackageManager(dataDir)
    apt.checkAptAvailable()
    this.#apt = apt

    // Recover interrupted operations from a previous crash
    const stale = await apt.cleanupStaleOperation()
    if (stale !== undefined) {
      log.warn('Cleaned up interrupted package operation', {
        operation: stale.operation,
        pid: stale.pid,
        startedAt: new Date(stale.startedAt).toISOString(),
      })
    }

    // Register API methods
    const listUpgradable = () => apt.listUpgradable()
    listUpgradable.permission = 'admin'
    listUpgradable.description = 'List upgradable system packages'

    const upgrade = ({ packages }: { packages?: string[] }) => apt.upgrade(packages)
    upgrade.permission = 'admin'
    upgrade.description = 'Upgrade system packages'
    upgrade.params = {
      packages: { type: 'array', items: { type: 'string' }, optional: true },
    }

    const systemUpgrade = () => apt.systemUpgrade()
    systemUpgrade.permission = 'admin'
    systemUpgrade.description = 'Perform a full distribution upgrade'

    const getOperationStatus = () => apt.getOperationStatus()
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

    log.info('Plugin loaded')
  }

  async unload() {
    this.#unregisterApiMethods?.()
    this.#unregisterApiMethods = undefined
    this.#apt = undefined
    log.info('Plugin unloaded')
  }
}

// --- Factory (default export) ---
export default function packageManagerPluginFactory(opts: { xo: any; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
