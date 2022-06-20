import Collection from '../collection/redis.mjs'
import { createLogger } from '@xen-orchestra/log'
import { forEach } from '../utils.mjs'

const log = createLogger('xo:plugin-metadata')

// ===================================================================

export class PluginsMetadata extends Collection {
  async save({ id, autoload, configuration }) {
    return /* await */ this.update({
      id,
      autoload: autoload ? 'true' : 'false',
      configuration: configuration && JSON.stringify(configuration),
    })
  }

  async merge(id, data) {
    const pluginMetadata = await this.first(id)
    if (pluginMetadata === undefined) {
      throw new Error('no such plugin metadata')
    }

    return /* await */ this.save({
      ...pluginMetadata,
      ...data,
    })
  }

  async get(properties) {
    const pluginsMetadata = await super.get(properties)

    // Deserializes.
    forEach(pluginsMetadata, pluginMetadata => {
      const { autoload, configuration } = pluginMetadata
      pluginMetadata.autoload = autoload === 'true'
      try {
        pluginMetadata.configuration = configuration && JSON.parse(configuration)
      } catch (error) {
        log.warn(`cannot parse pluginMetadata.configuration: ${configuration}`)
        pluginMetadata.configuration = []
      }
    })

    return pluginsMetadata
  }
}
