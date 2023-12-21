import Collection from '../collection/redis.mjs'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:plugin-metadata')

// ===================================================================

export class PluginsMetadata extends Collection {
  _serialize(metadata) {
    const { autoload, configuration } = metadata
    metadata.autoload = JSON.stringify(autoload)
    metadata.configuration = JSON.stringify(configuration)
  }

  _unserialize(metadata) {
    const { autoload, configuration } = metadata
    metadata.autoload = autoload === 'true'
    try {
      metadata.configuration = configuration && JSON.parse(configuration)
    } catch (error) {
      log.warn(`cannot parse pluginMetadata.configuration: ${configuration}`)
      metadata.configuration = []
    }
  }

  async merge(id, data) {
    const pluginMetadata = await this.first(id)
    if (pluginMetadata === undefined) {
      throw new Error('no such plugin metadata')
    }

    await this.update({
      ...pluginMetadata,
      ...data,
    })
  }
}
