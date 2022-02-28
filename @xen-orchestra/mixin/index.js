'use strict'

const camelCase = require('lodash/camelCase')

const { defineProperties, defineProperty, keys } = Object
const noop = Function.prototype

const MIXIN_CYCLIC_DESCRIPTOR = {
  configurable: true,
  get() {
    throw new Error('cyclic dependency')
  },
}

module.exports = function mixin(object, mixins, args) {
  // add lazy property for each of the mixin, this allows mixins to depend on
  // one another without any special ordering
  const descriptors = {}
  keys(mixins).forEach(name => {
    const Mixin = mixins[name]
    name = camelCase(name)

    descriptors[name] = {
      configurable: true,
      get: () => {
        defineProperty(object, name, MIXIN_CYCLIC_DESCRIPTOR)
        const instance = new Mixin(object, ...args)
        defineProperty(object, name, {
          value: instance,
        })
        return instance
      },
    }
  })
  defineProperties(object, descriptors)

  // access all mixin properties to trigger their creation
  keys(descriptors).forEach(name => {
    noop(object[name])
  })
}
