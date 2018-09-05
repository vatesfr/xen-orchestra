import Collection from '../collection/redis'
import Model from '../model'

// ===================================================================

export default class PluginMetadata extends Model {}

// ===================================================================

export class PluginsMetadata extends Collection {
  get Model() {
    return PluginMetadata
  }

  async merge(id, data) {
    const pluginMetadata = await this.first(id)
    if (pluginMetadata === undefined) {
      throw new Error('no such plugin metadata')
    }

    return /* await */ this.save({
      ...pluginMetadata.properties,
      ...data,
    })
  }
}
