import createJsonSchemaValidator from 'is-my-json-valid'

import { PluginsMetadata } from '../models/plugin-metadata'
import {
  InvalidParameters,
  NoSuchObject
} from '../api-errors'
import {
  createRawObject,
  isFunction,
  mapToArray
} from '../utils'

// ===================================================================

class NoSuchPlugin extends NoSuchObject {
  constructor (id) {
    super(id, 'plugin')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._plugins = createRawObject()

    this._pluginsMetadata = new PluginsMetadata({
      connection: xo._redis,
      prefix: 'xo:plugin-metadata'
    })
  }

  _getRawPlugin (id) {
    const plugin = this._plugins[id]
    if (!plugin) {
      throw new NoSuchPlugin(id)
    }
    return plugin
  }

  async _getPluginMetadata (id) {
    const metadata = await this._pluginsMetadata.first(id)
    return metadata
      ? metadata.properties
      : null
  }

  async registerPlugin (
    name,
    instance,
    configurationSchema,
    version
  ) {
    const id = name

    const plugin = this._plugins[id] = {
      configured: !configurationSchema,
      configurationSchema,
      id,
      instance,
      name,
      unloadable: isFunction(instance.unload),
      version
    }

    const metadata = await this._getPluginMetadata(id)
    let autoload = true
    let configuration

    if (metadata) {
      ({
        autoload,
        configuration
      } = metadata)
    } else {
      console.log(`[NOTICE] register plugin ${name} for the first time`)
      await this._pluginsMetadata.save({
        id,
        autoload
      })
    }

    // Configure plugin if necessary. (i.e. configurationSchema)
    // Load plugin.
    // Ignore configuration and loading errors.
    Promise.resolve()
      .then(() => {
        if (!plugin.configured) {
          return this._configurePlugin(plugin, configuration)
        }
      })
      .then(() => {
        if (autoload) {
          return this.loadPlugin(id)
        }
      })
      .catch(error => {
        console.error('register plugin %s: %s', name, error && error.stack || error)
      })
  }

  async _getPlugin (id) {
    const {
      configurationSchema,
      loaded,
      name,
      unloadable,
      version
    } = this._getRawPlugin(id)
    const {
      autoload,
      configuration
    } = (await this._getPluginMetadata(id)) || {}

    return {
      id,
      name,
      autoload,
      loaded,
      unloadable,
      version,
      configuration,
      configurationSchema
    }
  }

  async getPlugins () {
    return /* await */ Promise.all(
      mapToArray(this._plugins, ({ id }) => this._getPlugin(id))
    )
  }

  // Validate the configuration and configure the plugin instance.
  async _configurePlugin (plugin, configuration) {
    if (!plugin.configurationSchema) {
      throw new InvalidParameters('plugin not configurable')
    }

    const validate = createJsonSchemaValidator(plugin.configurationSchema)
    if (!validate(configuration)) {
      throw new InvalidParameters(validate.errors)
    }

    // Sets the plugin configuration.
    await plugin.instance.configure({
      // Shallow copy of the configuration object to avoid most of the
      // errors when the plugin is altering the configuration object
      // which is handed over to it.
      ...configuration
    })
    plugin.configured = true
  }

  // Validate the configuration, configure the plugin instance and
  // save the new configuration.
  async configurePlugin (id, configuration) {
    const plugin = this._getRawPlugin(id)

    await this._configurePlugin(plugin, configuration)

    // Saves the configuration.
    await this._pluginsMetadata.merge(id, { configuration })
  }

  async disablePluginAutoload (id) {
    // TODO: handle case where autoload is already disabled.

    await this._pluginsMetadata.merge(id, { autoload: false })
  }

  async enablePluginAutoload (id) {
    // TODO: handle case where autoload is already enabled.

    await this._pluginsMetadata.merge(id, { autoload: true })
  }

  async loadPlugin (id) {
    const plugin = this._getRawPlugin(id)
    if (plugin.loaded) {
      throw new InvalidParameters('plugin already loaded')
    }

    if (!plugin.configured) {
      throw new InvalidParameters('plugin not configured')
    }

    await plugin.instance.load()
    plugin.loaded = true
  }

  async unloadPlugin (id) {
    const plugin = this._getRawPlugin(id)
    if (!plugin.loaded) {
      throw new InvalidParameters('plugin already unloaded')
    }

    if (plugin.unloadable === false) {
      throw new InvalidParameters('plugin cannot be unloaded')
    }

    await plugin.instance.unload()
    plugin.loaded = false
  }

  async purgePluginConfiguration (id) {
    await this._pluginsMetadata.merge(id, { configuration: undefined })
  }
}
