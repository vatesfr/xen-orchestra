import angular from 'angular'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import marked from 'marked'
import trim from 'lodash.trim'
import uiRouter from 'angular-ui-router'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'
import multiStringView from './multi-string-view'
import objectInputView from './object-input-view'

function isRequired (key, schema) {
  return find(schema.required, item => item === key) || false
}

function isPassword (key) {
  return key.search(/password|secret/i) !== -1
}

function loadDefaults (schema, configuration) {
  if (!schema || !configuration) {
    return
  }
  forEach(schema.properties, (item, key) => {
    if (item.type === 'boolean' && !(key in configuration)) { // String default values are used as placeholders in view
      configuration[key] = item && item.default
    }
  })
}

function cleanUpConfiguration (schema, configuration) {
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
    if (item === undefined || item === null || item === '' || (Array.isArray(item) && item.length === 0) || item.__use === false) {
      return false
    } else {
      return true
    }
  }

  forEach(configuration, (item, key) => {
    item = sanitizeItem(item)
    configuration[key] = item
    if (!keepItem(item) || !schema.properties || !(key in schema.properties)) {
      delete configuration[key]
    } else if (schema.properties && schema.properties[key] && schema.properties[key].type === 'object') {
      cleanUpConfiguration(schema.properties[key], item)
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
  .controller('SettingsPlugins', function (xo, notify) {
    this.disabled = {}

    const refreshPlugins = () => xo.plugin.get().then(plugins => {
      forEach(plugins, plugin => {
        plugin._loaded = plugin.loaded
        plugin._autoload = plugin.autoload
        if (!plugin.configuration) {
          plugin.configuration = {}
        }
        loadDefaults(plugin.configurationSchema, plugin.configuration)
      })
      this.plugins = plugins
    })
    refreshPlugins()

    const _execPluginMethod = (id, method, ...args) => {
      this.disabled[id] = true
      return xo.plugin[method](...args)
      .finally(() => {
        return refreshPlugins()
        .then(() => this.disabled[id] = false)
      })
    }

    this.isRequired = isRequired
    this.isPassword = isPassword
    this.configure = (plugin) => {
      cleanUpConfiguration(plugin.configurationSchema, plugin.configuration)
      _execPluginMethod(plugin.id, 'configure', plugin.id, plugin.configuration)
      .then(() => notify.info({
        title: 'Plugin configuration',
        message: 'Successfully saved'
      }))
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
      }
    }
  })

  .directive('multiStringInput', () => {
    return {
      restrict: 'E',
      template: multiStringView,
      scope: {
        model: '='
      },
      controller: 'MultiString as ctrl',
      bindToController: true
    }
  })

  .controller('MultiString', function ($scope, xo, xoApi) {
    if (this.model === undefined || this.model === null) {
      this.model = []
    }
    if (!Array.isArray(this.model)) {
      throw new Error('multiString directive model must be an array')
    }

    this.add = (string) => {
      string = trim(string)
      if (string === '') {
        return
      }
      this.model.push(string)
    }

    this.remove = (index) => {
      this.model.splice(index, 1)
    }
  })

  .directive('objectInput', () => {
    return {
      restrict: 'E',
      template: objectInputView,
      scope: {
        model: '=',
        schema: '=',
        required: '='
      },
      controller: 'ObjectInput as ctrl',
      bindToController: true
    }
  })

  .controller('ObjectInput', function ($scope, xo, xoApi) {
    const prepareModel = () => {
      if (this.model === undefined || this.model === null) {
        this.model = {
          __use: this.required
        }
      } else {
        if (typeof this.model !== 'object' || Array.isArray(this.model)) {
          throw new Error('objectInput directive model must be a plain object')
        }
        if (!('__use' in this.model)) {
          this.model.__use = true
        }
      }
      loadDefaults(this.schema, this.model)
    }

    prepareModel()
    $scope.$watch(() => this.model, prepareModel)

    this.isRequired = isRequired
    this.isPassword = isPassword
  })

  .filter('md2html', function ($sce) {
    return function (input) {
      return $sce.trustAsHtml(marked(input || ''))
    }
  })

  .name
