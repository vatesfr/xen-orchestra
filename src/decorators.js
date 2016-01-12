import bind from 'lodash.bind'
import isArray from 'lodash.isarray'
import isFunction from 'lodash.isfunction'

// ===================================================================

const {
  defineProperties,
  defineProperty,
  getOwnPropertyDescriptor
} = Object

// ===================================================================

// See: https://github.com/jayphelps/core-decorators.js#autobind
export function autobind (target, key, {
  configurable,
  enumerable,
  value: fn,
  writable
}) {
  return {
    configurable,
    enumerable,

    get () {
      const bounded = bind(fn, this)

      defineProperty(this, key, {
        configurable: true,
        enumerable: false,
        value: bounded,
        writable: true
      })

      return bounded
    },
    set (newValue) {
      if (this === target) {
        // New value directly set on the prototype.
        delete this[key]
        this[key] = newValue
      } else {
        // New value set on a child object.

        // Cannot use assignment because it will call the setter on
        // the prototype.
        defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          value: newValue,
          writable: true
        })
      }
    }
  }
}

// -------------------------------------------------------------------

// Debounce decorator for methods.
//
// See: https://github.com/wycats/javascript-decorators
export const debounce = (duration) => (target, name, descriptor) => {
  const {value: fn} = descriptor

  // This symbol is used to store the related data directly on the
  // current object.
  const s = Symbol()

  function debounced () {
    let data = this[s] || (this[s] = {
      lastCall: 0,
      wrapper: null
    })

    const now = Date.now()
    if (now > data.lastCall + duration) {
      data.lastCall = now
      try {
        const result = fn.apply(this, arguments)
        data.wrapper = () => result
      } catch (error) {
        data.wrapper = () => { throw error }
      }
    }
    return data.wrapper()
  }
  debounced.reset = (obj) => { delete obj[s] }

  descriptor.value = debounced
  return descriptor
}

// -------------------------------------------------------------------

const _ownKeys = (
  typeof Reflect !== 'undefined' && Reflect.ownKeys ||
  (({
    getOwnPropertyNames: names,
    getOwnPropertySymbols: symbols
  }) => symbols
    ? obj => names(obj).concat(symbols(obj))
    : names
  )(Object)
)

const _isIgnoredProperty = name => (
  name[0] === '_' ||
  name === 'constructor'
)

const _isIgnoredStaticProperty = name => (
  name === 'length' ||
  name === 'name' ||
  name === 'prototype'
)

export const mixin = MixIns => Class => {
  if (!isArray(MixIns)) {
    MixIns = [ MixIns ]
  }

  const { name } = Class

  const Decorator = (...args) => {
    const instance = new Class(...args)

    for (const MixIn of MixIns) {
      const mixinInstance = new MixIn(instance)
      const descriptors = { __proto__: null }
      for (const prop of _ownKeys(MixIn.prototype)) {
        if (_isIgnoredProperty(prop)) {
          continue
        }

        if (prop in instance) {
          throw new Error(`${name}#${prop} is already defined`)
        }

        const value = mixinInstance[prop]
        descriptors[prop] = {
          configurable: true,
          value: isFunction(value)
            ? bind(value, mixinInstance)
            : value,
          writable: true
        }
      }
      defineProperties(instance, descriptors)
    }

    return instance
  }

  // Copy original and mixed-in static properties on Decorator class.
  const descriptors = { __proto__: null }
  for (const prop of _ownKeys(Class)) {
    descriptors[prop] = getOwnPropertyDescriptor(Class, prop)
  }
  for (const MixIn of MixIns) {
    for (const prop of _ownKeys(MixIn)) {
      if (_isIgnoredStaticProperty(prop)) {
        continue
      }

      if (prop in descriptors) {
        throw new Error(`${name}.${prop} is already defined`)
      }

      descriptors[prop] = getOwnPropertyDescriptor(MixIn, prop)
    }
  }
  defineProperties(Decorator, descriptors)

  return Decorator
}
