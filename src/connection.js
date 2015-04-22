import {EventEmitter} from 'events'

// ===================================================================

const has = (function () {
  return (val, prop) => hasOwnProperty.call(val, prop)
})(Object.hasOwnProperty)

const noop = () => {}

// ===================================================================

export default class Connection extends EventEmitter {
  constructor ({close, notify}) {
    super()

    this._close = close
    this.data = Object.create(null)
    this.notify = notify
  }

  // Close the connection.
  close () {
    // Prevent errors when the connection is closed more than once.
    this.close = noop

    this._close()

    this.emit('close')

    // Releases values AMAP to ease the garbage collecting.
    for (let key in this) {
      if (key !== 'close' && has(this, key)) {
        delete this[key]
      }
    }
  }

  // Gets the value for this key.
  get (key, defaultValue) {
    const {data} = this

    if (key in data) {
      return data[key]
    }

    if (arguments.length >= 2) {
      return defaultValue
    }

    throw new Error('no value for `' + key + '`')
  }

  // Checks whether there is a value for this key.
  has (key) {
    return key in this.data
  }

  // Sets the value for this key.
  set (key, value) {
    this.data[key] = value
  }

  unset (key) {
    delete this.data[key]
  }
}
