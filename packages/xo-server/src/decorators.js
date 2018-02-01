import { getBoundPropertyDescriptor } from 'bind-property-descriptor'

import {
  isArray,
  isFunction,
} from './utils'

// ===================================================================

const {
  defineProperties,
  getOwnPropertyDescriptor,
} = Object

// ===================================================================

// Debounce decorator for methods.
//
// See: https://github.com/wycats/javascript-decorators
//
// TODO: make it work for single functions.
export const debounce = duration => (target, name, descriptor) => {
  const fn = descriptor.value

  // This symbol is used to store the related data directly on the
  // current object.
  const s = Symbol(`debounced ${name} data`)

  function debounced () {
    const data = this[s] || (this[s] = {
      lastCall: 0,
      wrapper: null,
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
  debounced.reset = obj => { delete obj[s] }

  descriptor.value = debounced
  return descriptor
}

// -------------------------------------------------------------------

const _ownKeys = (
  (typeof Reflect !== 'undefined' && Reflect.ownKeys) ||
  (({
    getOwnPropertyNames: names,
    getOwnPropertySymbols: symbols,
  }) => symbols
    ? obj => names(obj).concat(symbols(obj))
    : names
  )(Object)
)

const _isIgnoredProperty = name => (
  name[0] === '_' ||
  name === 'constructor'
)

const _IGNORED_STATIC_PROPERTIES = {
  __proto__: null,

  arguments: true,
  caller: true,
  length: true,
  name: true,
  prototype: true,
}
const _isIgnoredStaticProperty = name => _IGNORED_STATIC_PROPERTIES[name]

export const mixin = MixIns => Class => {
  if (!isArray(MixIns)) {
    MixIns = [ MixIns ]
  }

  const { name } = Class

  // Copy properties of plain object mix-ins to the prototype.
  {
    const allMixIns = MixIns
    MixIns = []
    const { prototype } = Class
    const descriptors = { __proto__: null }
    for (const MixIn of allMixIns) {
      if (isFunction(MixIn)) {
        MixIns.push(MixIn)
        continue
      }

      for (const prop of _ownKeys(MixIn)) {
        if (prop in prototype) {
          throw new Error(`${name}#${prop} is already defined`)
        }

        (
          descriptors[prop] = getOwnPropertyDescriptor(MixIn, prop)
        ).enumerable = false // Object methods are enumerable but class methods are not.
      }
    }
    defineProperties(prototype, descriptors)
  }

  function Decorator (...args) {
    const instance = new Class(...args)

    for (const MixIn of MixIns) {
      const { prototype } = MixIn
      const mixinInstance = new MixIn(instance, ...args)
      const descriptors = { __proto__: null }
      for (const prop of _ownKeys(prototype)) {
        if (_isIgnoredProperty(prop)) {
          continue
        }

        if (prop in instance) {
          throw new Error(`${name}#${prop} is already defined`)
        }

        descriptors[prop] = getBoundPropertyDescriptor(
          prototype,
          prop,
          mixinInstance
        )
      }
      defineProperties(instance, descriptors)
    }

    return instance
  }

  // Copy original and mixed-in static properties on Decorator class.
  const descriptors = { __proto__: null }
  for (const prop of _ownKeys(Class)) {
    let descriptor
    if (!(
      // Special properties are not defined...
      _isIgnoredStaticProperty(prop) &&

      // if they already exist...
      (descriptor = getOwnPropertyDescriptor(Decorator, prop)) &&

      // and are not configurable.
      !descriptor.configurable
    )) {
      descriptors[prop] = getOwnPropertyDescriptor(Class, prop)
    }
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
