'use strict'

const camelCase = require('lodash/camelCase')

const {
  defineProperties,
  defineProperty,
  hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty),
  keys,
} = Object
const noop = Function.prototype

const MIXIN_CYCLIC_DESCRIPTOR = {
  configurable: true,
  get() {
    throw new Error('cyclic dependency')
  },
}

module.exports = function mixin(object, mixins, args) {
  const importing = { __proto__: null }
  const importers = { __proto__: null }

  function instantiateMixin(name, Mixin) {
    defineProperty(object, name, MIXIN_CYCLIC_DESCRIPTOR)
    const instance = new Mixin(object, ...args)
    defineProperty(object, name, {
      value: instance,
    })
    return instance
  }

  // add lazy property for each of the mixin, this allows mixins to depend on
  // one another without any special ordering
  const descriptors = {
    loadMixin(name) {
      if (hasOwn(this, name)) {
        return Promise.resolve(this[name])
      }

      let promise = importing[name]
      if (promise === undefined) {
        const clean = () => {
          delete importing[name]
        }
        promise = importers[name]().then(Mixin => instantiateMixin(name, Mixin))
        promise.then(clean, clean)
        importing[name] = promise
      }
      return promise
    },
  }
  keys(mixins).forEach(name => {
    const Mixin = mixins[name]
    name = camelCase(name)

    if (Mixin.prototype === undefined) {
      importers[name] = Mixin(name)
    } else {
      descriptors[name] = {
        configurable: true,
        get: () => instantiateMixin(name, Mixin),
      }
    }
  })
  defineProperties(object, descriptors)

  // access all mixin properties to trigger their creation
  keys(descriptors).forEach(name => {
    noop(object[name])
  })
}
