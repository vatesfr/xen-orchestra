import angular from 'angular'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import trim from 'lodash.trim'
import uiRouter from 'angular-ui-router'
import remove from 'lodash.remove'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

function loadDefaults (schema, configuration) {
  if (!schema || !configuration) {
    return
  }
  forEach(schema.properties, (item, key) => {
    if (item.type === 'boolean' && !(key in configuration)) { // String default values are used as placeholders in view
      configuration[key] = Boolean(item && item.default)
    }
  })
}

function setOptionalProperties (configurationSchema) {
  if (!configurationSchema) {
    return
  }

  forEach(configurationSchema.properties, (property, key) => {
    let { required } = configurationSchema

    if (!required) {
      required = configurationSchema.required = []
    }

    property.optional = !includes(required, key)

    const { type, items } = property

    if (type === 'object') {
      setOptionalProperties(property)
    } else if (type === 'array' && items && items.type === 'object') {
      setOptionalProperties(items)
    }
  })
}

function cleanUpConfiguration (schema, configuration, dump = {}) {
  if (!schema || !configuration) {
    return
  }

  function sanitizeItem (item) {
    if (typeof item === 'string') {
      item = trim(item)
    }
    return item
  }

  function keepItem (item) {
    return !(item == null || item === '' || (Array.isArray(item) && item.length === 0))
  }

  forEach(configuration, (item, key) => {
    item = sanitizeItem(item)
    configuration[key] = item
    dump[key] = item

    if (!keepItem(item) || !schema.properties || !(key in schema.properties)) {
      delete dump[key]
    } else if (schema.properties && schema.properties[key]) {
      const type = schema.properties[key].type

      if (type === 'integer' || type === 'number') {
        dump[key] = +dump[key]
      } else if (type === 'object') {
        dump[key] = {}
        cleanUpConfiguration(schema.properties[key], item, dump[key])
      }
    }
  })
}

export default angular.module('settings.plugins', [
  uiRouter,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.plugins', {
      controller: 'SettingsPlugins as ctrl',
      url: '/plugins',
      data: {
        requireAdmin: true
      },
      resolve: {
      },
      template: view
    })
  })
  .controller('SettingsPlugins', function (xo, notify, modal) {
    this.disabled = {}

    const preparePluginForView = plugin => {
      const { configurationSchema } = plugin

      plugin._loaded = plugin.loaded
      plugin._autoload = plugin.autoload

      if (!plugin.configuration) {
        plugin.configuration = {}
      }

      setOptionalProperties(configurationSchema)
      loadDefaults(configurationSchema, plugin.configuration)
    }

    const refreshPlugin = id => {
      return xo.plugin.get()
      .then(plugins => {
        const plugin = find(plugins, plugin => plugin.id === id)
        if (plugin) {
          preparePluginForView(plugin)
          remove(this.plugins, plugin => plugin.id === id)
          this.plugins.push(plugin)
        }
      })
    }

    const refreshPlugins = () => xo.plugin.get().then(plugins => {
      forEach(plugins, preparePluginForView)
      this.plugins = plugins
    })
    refreshPlugins()

    const _execPluginMethod = (id, method, ...args) => {
      this.disabled[id] = true
      return xo.plugin[method](...args)
      .finally(() => {
        this.disabled[id] = false
      })
    }

    this.configure = (plugin) => {
      const newConfiguration = {}
      plugin.errors = []

      cleanUpConfiguration(plugin.configurationSchema, plugin.configuration, newConfiguration)
      _execPluginMethod(plugin.id, 'configure', plugin.id, newConfiguration)
      .then(() => {
        notify.info({
          title: 'Plugin configuration',
          message: 'Successfully saved'
        })
        refreshPlugin(plugin.id)
      })
      .catch(err => {
        forEach(err.data, data => {
          const fieldPath = data.field.split('.').slice(1)
          const fieldPathTitles = []
          let groupObject = plugin.configurationSchema
          forEach(fieldPath, groupName => {
            groupObject = groupObject.properties[groupName]
            fieldPathTitles.push(groupObject.title || groupName)
          })
          plugin.errors.push(`${fieldPathTitles.join(' > ')} ${data.message}`)
        })
      })
    }

    this.purgeConfiguration = (plugin) => {
      modal.confirm({
        title: 'Purge configuration',
        message: 'Are you sure you want to purge this configuration ?'
      }).then(() => {
        _execPluginMethod(plugin.id, 'purgeConfiguration', plugin.id).then(() => {
          refreshPlugin(plugin.id).then(() =>
            notify.info({
              title: 'Purge configuration',
              message: 'This plugin config is now purged.'
            })
          )
        })
      })
    }

    this.toggleAutoload = (plugin) => {
      let method
      if (!plugin._autoload && plugin.autoload) {
        method = 'disableAutoload'
      } else if (plugin._autoload && !plugin.autoload) {
        method = 'enableAutoload'
      }
      if (method) {
        _execPluginMethod(plugin.id, method, plugin.id)
      }
    }
    this.toggleLoad = (plugin) => {
      let method
      if (!plugin._loaded && plugin.loaded && plugin.unloadable !== false) {
        method = 'unload'
      } else if (plugin._loaded && !plugin.loaded) {
        method = 'load'
      }
      if (method) {
        _execPluginMethod(plugin.id, method, plugin.id)
        refreshPlugin(plugin.id)
      }
    }
  })
  .name
