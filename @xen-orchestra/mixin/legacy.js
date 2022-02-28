'use strict'

const { getBoundPropertyDescriptor } = require('bind-property-descriptor')

// ===================================================================

const { defineProperties, getOwnPropertyDescriptor } = Object

const isIgnoredProperty = name => name[0] === '_' || name === 'constructor'

const IGNORED_STATIC_PROPERTIES = {
  __proto__: null,

  arguments: true,
  caller: true,
  length: true,
  name: true,
  prototype: true,
}
const isIgnoredStaticProperty = name => name in IGNORED_STATIC_PROPERTIES

const ownKeys =
  (typeof Reflect !== 'undefined' && Reflect.ownKeys) ||
  (({ getOwnPropertyNames: names, getOwnPropertySymbols: symbols }) =>
    symbols !== undefined ? obj => names(obj).concat(symbols(obj)) : names)(Object)

// -------------------------------------------------------------------

const mixin = Mixins => Class => {
  if (!Array.isArray(Mixins)) {
    throw new TypeError('Mixins should be an array')
  }

  const { name } = Class

  // Copy properties of plain object mix-ins to the prototype.
  {
    const allMixins = Mixins
    Mixins = []
    const { prototype } = Class
    const descriptors = { __proto__: null }
    allMixins.forEach(Mixin => {
      if (typeof Mixin === 'function') {
        Mixins.push(Mixin)
        return
      }

      for (const prop of ownKeys(Mixin)) {
        if (prop in prototype) {
          throw new Error(`${name}#${prop} is already defined`)
        }

        ;(descriptors[prop] = getOwnPropertyDescriptor(Mixin, prop)).enumerable = false // Object methods are enumerable but class methods are not.
      }
    })
    defineProperties(prototype, descriptors)
  }

  const n = Mixins.length

  function DecoratedClass(...args) {
    const instance = new Class(...args)

    for (let i = 0; i < n; ++i) {
      const Mixin = Mixins[i]
      const { prototype } = Mixin
      const mixinInstance = new Mixin(instance, ...args)
      const descriptors = { __proto__: null }
      const props = ownKeys(prototype)
      for (let j = 0, m = props.length; j < m; ++j) {
        const prop = props[j]

        if (isIgnoredProperty(prop)) {
          continue
        }

        if (prop in instance) {
          throw new Error(`${name}#${prop} is already defined`)
        }

        descriptors[prop] = getBoundPropertyDescriptor(prototype, prop, mixinInstance)
      }
      defineProperties(instance, descriptors)
    }

    return instance
  }

  // Copy original and mixed-in static properties on Decorator class.
  const descriptors = { __proto__: null }
  ownKeys(Class).forEach(prop => {
    let descriptor
    if (
      !(
        isIgnoredStaticProperty(prop) &&
        // if they already exist...
        (descriptor = getOwnPropertyDescriptor(DecoratedClass, prop)) !== undefined &&
        // and are not configurable.
        !descriptor.configurable
      )
    ) {
      descriptors[prop] = getOwnPropertyDescriptor(Class, prop)
    }
  })
  Mixins.forEach(Mixin => {
    ownKeys(Mixin).forEach(prop => {
      if (isIgnoredStaticProperty(prop)) {
        return
      }

      if (prop in descriptors) {
        throw new Error(`${name}.${prop} is already defined`)
      }

      descriptors[prop] = getOwnPropertyDescriptor(Mixin, prop)
    })
  })
  defineProperties(DecoratedClass, descriptors)

  return DecoratedClass
}
module.exports = mixin
