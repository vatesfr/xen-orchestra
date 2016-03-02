import {EventEmitter} from 'events'

import {
  forEach,
  isEmpty,
  isString
} from './utils'

// ===================================================================

export default class Model extends EventEmitter {
  constructor (properties) {
    super()

    this.properties = { ...this.default }

    if (properties) {
      this.set(properties)
    }
  }

  // Initialize the model after construction.
  initialize () {}

  // Validate the defined properties.
  //
  // Returns the error if any.
  validate (properties) {}

  // Get a property.
  get (name, def) {
    const value = this.properties[name]
    return value !== undefined ? value : def
  }

  // Check whether a property exists.
  has (name) {
    return (this.properties[name] !== undefined)
  }

  // Set properties.
  set (properties, value) {
    // This method can also be used with two arguments to set a single
    // property.
    if (isString(properties)) {
      properties = { [properties]: value }
    }

    const previous = {}

    forEach(properties, (value, name) => {
      const prev = this.properties[name]

      if (value !== prev) {
        previous[name] = prev

        if (value === undefined) {
          delete this.properties[name]
        } else {
          this.properties[name] = value
        }
      }
    })

    if (!isEmpty(previous)) {
      this.emit('change', previous)

      forEach(previous, (value, name) => {
        this.emit('change:' + name, value)
      })
    }
  }
}
