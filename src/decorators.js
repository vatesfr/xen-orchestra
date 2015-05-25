import bind from 'lodash.bind'

// ===================================================================

const {defineProperty} = Object

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
