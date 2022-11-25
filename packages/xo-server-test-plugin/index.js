/* eslint-disable no-console */

'use strict'

// This is one of the simplest xo-server's plugin than can be created.

// This (optional) schema is used to describe the expected
// configuration of the plugin.
//
// It will be used to generate a configuration UI (xo-web) and to
// validate the provided configuration.
exports.configurationSchema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
  required: ['foo'],
}

// This (optional) schema is used to test the configuration
// of the plugin.
exports.testSchema = {
  type: 'object',
  properties: {
    test: {
      type: 'string',
    },
  },
  required: ['test'],
}

// The default export is just a factory function which will create an
// instance of the plugin.
// Usually it will be called only once, at startup.
//
// Its only parameter is an object which currently only contains a
// `xo` property: the instance of the currently running xo-server.
exports.default = function (opts) {
  // For simplicity's sake, this plugin returns a plain object, but
  // usually it returns a new instance of an existing class.
  return {
    // This (optional) method is called each time the plugin is
    // (re-)configured.
    //
    // Note: before being called, the configuration is validated
    // against the provided configuration schema.
    configure: function (configuration, state) {
      console.log('stub configured', configuration)
      console.log('sub is currently', state.loaded ? 'loaded' : 'unloaded')
    },

    // This method is called to load the plugin.
    //
    // Note 1: will only be called if the plugin is currently
    // unloaded.
    //
    // Note 2: if the plugin is configurable, will only be called if
    // the plugin has been successfully configured.
    load: function () {
      console.log('stub loaded')
    },

    // This (optional) method is called to unload the plugin.
    //
    // Note: will only be called if the plugin is currently loaded.
    unload: function () {
      console.log('stub unloaded')
    },

    // This (optional) method is called to test the configuration of the plugin.
    // Note 1: will only be called if the plugin has been successfully configured and is loaded.
    // Note 2: before being called, the test configuration is validated
    // against the provided test data.
    // Note 3: will only be called if the test option is activated.
    test: function (data) {
      console.log('the configuration is about to be tested')
      // TODO: test the configuration, i.e, use the main feature of the plugin and throws any errors.
    },
  }
}

/* eslint-enable no-console */
