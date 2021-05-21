import { EventEmitter } from 'events'

import { noop } from './utils.mjs'

// ===================================================================

export default class Connection extends EventEmitter {
  constructor() {
    super()

    this._data = { __proto__: null }
  }

  // Close the connection.
  close() {
    // Prevent errors when the connection is closed more than once.
    this.close = noop

    this.emit('close')
  }

  // Gets the value for this key.
  get(key, defaultValue) {
    const { _data: data } = this

    if (key in data) {
      return data[key]
    }

    if (arguments.length >= 2) {
      return defaultValue
    }

    throw new Error('no value for `' + key + '`')
  }

  // Checks whether there is a value for this key.
  has(key) {
    return key in this._data
  }

  // Sets the value for this key.
  set(key, value) {
    this._data[key] = value
  }

  unset(key) {
    delete this._data[key]
  }
}
