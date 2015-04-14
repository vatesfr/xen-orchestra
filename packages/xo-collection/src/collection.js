import forEach from 'lodash.foreach'
import makeError, {BaseError} from 'make-error'
import {EventEmitter} from 'events'

// ===================================================================

function isNotEmpty (map) {
  /* eslint no-unused-vars: 0*/

  for (let key in map) {
    return true
  }
  return false
}

// ===================================================================

export class BufferAlreadyFlushed extends BaseError {
  constructor () {
    super('buffer flush already requested')
  }
}

export class DuplicateItem extends BaseError {
  constructor (key) {
    super('there is already a item with the key ' + key)
  }
}

export class IllegalTouch extends BaseError {
  constructor (value) {
    super('only an object value can be touched (found a ' + typeof value + ')')
  }
}

export class InvalidKey extends BaseError {
  constructor (key) {
    super('invalid key of type ' + typeof key)
  }
}

export class NoSuchItem extends BaseError {
  constructor (key) {
    super('there is no item with the key ' + key)
  }
}

// -------------------------------------------------------------------

export default class Collection extends EventEmitter {
  constructor () {
    super()

    this._buffer = Object.create(null)
    this._buffering = 0
    this._items = Object.create(null)
    this._size = 0
  }

  bufferEvents () {
    ++this._buffering

    let called = false
    return () => {
      if (called) {
        throw new BufferAlreadyFlushed()
      }
      called = true

      if (--this._buffering) {
        return
      }

      const data = {
        add: Object.create(null),
        remove: Object.create(null),
        update: Object.create(null)
      }

      for (let key in this._buffer) {
        data[this._buffer[key]][key] = this._items[key]
      }

      forEach(['add', 'update', 'remove'], action => {
        const items = data[action]

        if (isNotEmpty(items)) {
          this.emit(action, items)
        }
      })

      this._buffer = Object.create(null)
    }
  }

  _touch (action, key) {
    if (this._buffering === 0) {
      const flush = this.bufferEvents()

      process.nextTick(flush)
    }

    if (action === 'add') {
      this._buffer[key] = this._buffer[key] ? 'update' : 'add'
    } else if (action === 'remove') {
      if (this._buffer[key] === 'add') {
        delete this._buffer[key]
      } else {
        this._buffer[key] = 'remove'
      }
    } else { // update
      if (!this._buffer[key]) {
        this._buffer[key] = 'update'
      }
    }
  }

  getId (item) {
    return item && item.id
  }

  has (key) {
    return Object.hasOwnProperty.call(this._items, key)
  }

  _isValidKey (key) {
    return typeof key === 'number' || typeof key === 'string'
  }

  _assertValidKey (key) {
    if (!this._isValidKey(key)) {
      throw new InvalidKey(key)
    }
  }

  _resolveItem (keyOrObjectWithId, valueIfKey = undefined) {
    if (valueIfKey !== undefined) {
      this._assertValidKey(keyOrObjectWithId)

      return [keyOrObjectWithId, valueIfKey]
    }

    if (this._isValidKey(keyOrObjectWithId)) {
      return [keyOrObjectWithId]
    }

    const key = this.getId(keyOrObjectWithId)
    this._assertValidKey(key)

    return [key, keyOrObjectWithId]
  }

  _assertHas (key) {
    if (!this.has(key)) {
      throw new NoSuchItem(key)
    }
  }

  _assertHasNot (key) {
    if (this.has(key)) {
      throw new DuplicateItem(key)
    }
  }

  add (keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHasNot(key)

    this._items[key] = value
    this._size++
    this._touch('add', key)
  }

  set (keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)

    const action = this.has(key) ? 'update' : 'add'
    this._items[key] = value
    if (action === 'add') {
      this._size++
    }
    this._touch(action, key)
  }

  get (key, defaultValue) {
    if (this.has(key)) {
      return this._items[key]
    }

    if (arguments.length > 1) {
      return defaultValue
    }

    // Throws a NoSuchItem.
    this._assertHas(key)
  }

  update (keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHas(key)

    this._items[key] = value
    this._touch('update', key)
  }

  touch (keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId)
    this._assertHas(key)
    const value = this.get(key)
    if (typeof value !== 'object' || value === null) {
      throw new IllegalTouch(value)
    }

    this._touch('update', key)

    return this.get(key)
  }

  remove (keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId)
    this._assertHas(key)

    delete this._items[key]
    this._size--
    this._touch('remove', key)
  }

  clear () {
    forEach(this._items, (_, key) => {
      delete this._items[key]
      this._size--
      this._touch('remove', key)
    })
  }

  get size () {
    return this._size
  }

  get all () {
    return this._items
  }
}
