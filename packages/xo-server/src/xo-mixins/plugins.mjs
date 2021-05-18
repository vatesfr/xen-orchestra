import Ajv from 'ajv'
import mapToArray from 'lodash/map.js'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

import * as sensitiveValues from '../sensitive-values.mjs'
import { PluginsMetadata } from '../models/plugin-metadata.mjs'

// ===================================================================

const log = createLogger('xo:xo-mixins:plugins')

export default class {
  constructor(app) {
    this._ajv = new Ajv({
      strict: 'log',
      useDefaults: true,
    }).addVocabulary(['$type', 'enumNames'])
    this._plugins = { __proto__: null }

    this._pluginsMetadata = new PluginsMetadata({
      connection: app._redis,
      prefix: 'xo:plugin-metadata',
    })

    app.hooks.on('start', () => {
      app.addConfigManager(
        'plugins',
        () => this._pluginsMetadata.get(),
        plugins => Promise.all(plugins.map(plugin => this._pluginsMetadata.save(plugin)))
      )
    })
  }

  _getRawPlugin(id) {
    const plugin = this._plugins[id]
    if (!plugin) {
      throw noSuchObject(id, 'plugin')
    }
    return plugin
  }

  async _getPluginMetadata(id) {
    const metadata = await this._pluginsMetadata.first(id)
    return metadata?.properties
  }

  async registerPlugin(name, instance, configurationSchema, configurationPresets, description, testSchema, version) {
    const id = name
    const plugin = (this._plugins[id] = {
      configurationPresets,
      configurationSchema,
      configured: configurationSchema === undefined,
      description,
      id,
      instance,
      name,
      testable: typeof instance.test === 'function',
      testSchema,
      unloadable: typeof instance.unload === 'function',
      version,
    })

    const metadata = await this._getPluginMetadata(id)
    let autoload = true
    let configuration
    if (metadata !== undefined) {
      ;({ autoload, configuration } = metadata)
    } else {
      log.info(`[NOTICE] register plugin ${name} for the first time`)
      await this._pluginsMetadata.save({
        id,
        autoload,
      })
    }

    if (!plugin.configured) {
      const tryEmptyConfig = configuration === undefined
      try {
        await this._configurePlugin(plugin, tryEmptyConfig ? {} : configuration)
      } catch (error) {
        // dont throw any error in case the empty config did not work
        if (tryEmptyConfig) {
          return
        }
        throw error
      }
    }

    if (autoload) {
      await this.loadPlugin(id)
    }
  }

  async _getPlugin(id) {
    const {
      configurationPresets,
      configurationSchema,
      description,
      loaded,
      name,
      testable,
      testSchema,
      unloadable,
      version,
    } = this._getRawPlugin(id)
    const { autoload, configuration } = (await this._getPluginMetadata(id)) || {}

    return {
      id,
      name,
      autoload,
      description,
      loaded,
      unloadable,
      version,
      configuration: sensitiveValues.obfuscate(configuration),
      configurationPresets,
      configurationSchema,
      testable,
      testSchema,
    }
  }

  async getPlugins() {
    return /* await */ Promise.all(mapToArray(this._plugins, ({ id }) => this._getPlugin(id)))
  }

  // Validate the configuration and configure the plugin instance.
  async _configurePlugin(plugin, configuration) {
    const { configurationSchema } = plugin

    if (!configurationSchema) {
      throw invalidParameters('plugin not configurable')
    }

    const validate = this._ajv.compile(configurationSchema)
    if (!validate(configuration)) {
      throw invalidParameters(validate.errors)
    }

    // Sets the plugin configuration.
    await plugin.instance.configure(
      {
        // Shallow copy of the configuration object to avoid most of the
        // errors when the plugin is altering the configuration object
        // which is handed over to it.
        ...configuration,
      },
      {
        loaded: plugin.loaded,
      }
    )
    plugin.configured = true
  }

  // Validate the configuration, configure the plugin instance and
  // save the new configuration.
  async configurePlugin(id, configuration) {
    const plugin = this._getRawPlugin(id)
    const metadata = await this._getPluginMetadata(id)

    if (metadata !== undefined) {
      configuration = sensitiveValues.merge(configuration, metadata.configuration)
    }

    await this._configurePlugin(plugin, configuration)

    // Saves the configuration.
    await this._pluginsMetadata.merge(id, { configuration })
  }

  async disablePluginAutoload(id) {
    // TODO: handle case where autoload is already disabled.

    await this._pluginsMetadata.merge(id, { autoload: false })
  }

  async enablePluginAutoload(id) {
    // TODO: handle case where autoload is already enabled.

    await this._pluginsMetadata.merge(id, { autoload: true })
  }

  async loadPlugin(id) {
    const plugin = this._getRawPlugin(id)
    if (plugin.loaded) {
      throw invalidParameters('plugin already loaded')
    }

    if (!plugin.configured) {
      throw invalidParameters('plugin not configured')
    }

    if (plugin.loading) {
      throw invalidParameters('plugin is loading')
    }

    plugin.loading = true
    try {
      await plugin.instance.load()
      plugin.loaded = true
    } finally {
      plugin.loading = false
    }
  }

  async unloadPlugin(id) {
    const plugin = this._getRawPlugin(id)
    if (!plugin.loaded) {
      throw invalidParameters('plugin already unloaded')
    }

    if (plugin.unloadable === false) {
      throw invalidParameters('plugin cannot be unloaded')
    }

    await plugin.instance.unload()
    plugin.loaded = false
  }

  async purgePluginConfiguration(id) {
    await this._pluginsMetadata.merge(id, { configuration: undefined })
  }

  async testPlugin(id, data) {
    const plugin = this._getRawPlugin(id)
    if (!plugin.testable) {
      throw invalidParameters('plugin not testable')
    }
    if (!plugin.loaded) {
      throw invalidParameters('plugin not loaded')
    }

    const { testSchema } = plugin
    if (testSchema) {
      if (data == null) {
        throw invalidParameters([
          {
            field: 'data',
            message: 'is the wrong type',
          },
        ])
      }

      const validate = this._ajv.compile(testSchema)
      if (!validate(data)) {
        throw invalidParameters(validate.errors)
      }
    }

    await plugin.instance.test(data)
  }
}
