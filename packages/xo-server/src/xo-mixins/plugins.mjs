import Ajv from 'ajv'
import cloneDeep from 'lodash/cloneDeep.js'
import mapToArray from 'lodash/map.js'
import merge from 'lodash/merge.js'
import noop from 'lodash/noop.js'
import Obfuscate from '@vates/obfuscate'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

import { PluginsMetadata } from '../models/plugin-metadata.mjs'

// ===================================================================

const log = createLogger('xo:xo-mixins:plugins')

export default class {
  constructor(app) {
    this._ajv = new Ajv({
      strict: 'log',
      // `strictRequired` option seems to require that the object's properties are defined in the same sub-schema (even
      // though the documentation says that it can also be defined in a parent schema) which is inconvenient with
      // features such as `anyOf` (see xo-server-auth-oidc)
      // https://ajv.js.org/strict-mode.html#defined-required-properties
      strictRequired: false,
      useDefaults: true,
    }).addVocabulary(['$multiline', '$type', 'enumNames'])
    this._plugins = { __proto__: null }

    app.hooks.on('core started', () => {
      this._pluginsMetadata = new PluginsMetadata({
        connection: app._redis,
        namespace: 'plugin-metadata',
      })

      app.addConfigManager(
        'plugins',
        () => this._pluginsMetadata.get(),
        plugins =>
          Promise.all(
            plugins.map(async plugin => {
              await this._pluginsMetadata.update(plugin)
              if (plugin.configuration !== undefined && this._plugins[plugin.id] !== undefined) {
                await this.configurePlugin(plugin.id, plugin.configuration)
              }
            })
          )
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

  _getPluginMetadata(id) {
    return this._pluginsMetadata.first(id)
  }

  async registerPlugin(
    name,
    instance,
    configurationSchema,
    configurationPresets,
    description,
    keywords,
    testSchema,
    version
  ) {
    const id = name
    const plugin = (this._plugins[id] = {
      configurationPresets,
      configurationSchema,
      configured: configurationSchema === undefined,
      description,
      id,
      instance,
      keywords,
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
      await this._pluginsMetadata.update({
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

  async getPlugin(id) {
    const {
      configurationPresets,
      configurationSchema,
      description,
      keywords,
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
      keywords,
      unloadable,
      version,
      configuration: Obfuscate.obfuscate(configuration),
      configurationPresets,
      configurationSchema,
      testable,
      testSchema,
    }
  }

  async getOptionalPlugin(id) {
    try {
      return await this.getPlugin(id)
    } catch (error) {
      if (!noSuchObject.is(error, { id, type: 'plugin' })) {
        throw error
      }
    }
  }

  async getPlugins() {
    return /* await */ Promise.all(mapToArray(this._plugins, ({ id }) => this.getPlugin(id)))
  }

  // Validate the configuration and configure the plugin instance.
  async _configurePlugin(plugin, configuration) {
    const { configurationSchema } = plugin

    if (!configurationSchema) {
      throw invalidParameters('plugin not configurable')
    }

    const validate = this._ajv.compile(configurationSchema)

    // deep clone the configuration to avoid modifying the parameter
    configuration = cloneDeep(configuration)

    if (!validate(configuration)) {
      throw invalidParameters(validate.errors)
    }

    // Sets the plugin configuration.
    await plugin.instance.configure(configuration, {
      loaded: plugin.loaded,
    })
    plugin.configured = true
  }

  // Validate the configuration, configure the plugin instance and
  // save the new configuration.
  async configurePlugin(id, configuration, mergeWithExisting = false) {
    const plugin = this._getRawPlugin(id)
    const metadata = await this._getPluginMetadata(id)

    if (metadata !== undefined) {
      if (mergeWithExisting) {
        configuration = merge({}, metadata.configuration, configuration)
      }

      configuration = Obfuscate.merge(configuration, metadata.configuration)
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
    await this.unloadPlugin(id).catch(noop)
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
