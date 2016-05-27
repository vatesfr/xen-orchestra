exports.default = function (opts) {
  return {
    configure: function (configuration) {
      console.log('stub configured', configuration)
    },
    load: function () {
      console.log('stub loaded')
    },
    unload: function () {
      console.log('stub unloaded')
    }
  }
}

exports.configurationSchema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string'
    }
  },
  required: ['foo']
}
