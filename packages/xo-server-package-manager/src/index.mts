import type { XoApp } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import type { PackageManagerConfiguration } from './types.mjs'

const log = createLogger('xo:xo-server-package-manager')

export const configurationSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
}

class PackageManagerPlugin {
  #configuration: PackageManagerConfiguration | undefined

  constructor(_opts: { xo: XoApp; getDataDir: () => Promise<string> }) {}

  configure(configuration: PackageManagerConfiguration) {
    this.#configuration = configuration
  }

  async load() {
    log.info('Plugin loaded')
  }

  async unload() {
    log.info('Plugin unloaded')
  }
}

export default function packageManagerPluginFactory(opts: { xo: XoApp; getDataDir: () => Promise<string> }) {
  return new PackageManagerPlugin(opts)
}
