import {EventEmitter} from 'events'
import makeError from 'make-error'

export const BufferAlreadyFlushed = makeError('BufferAlreadyFlushed')
export const DuplicateItem = makeError('DuplicateItem')
export const IllegalAdd = makeError('IllegalAdd')
export const IllegalTouch = makeError('IllegalTouch')
export const NoSuchItem = makeError('NoSuchItem')

function isNotEmpty (map) {
  /* eslint no-unused-vars: 0*/

  for (let key in map) {
    return true
  }
  return false
}

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
        throw new BufferAlreadyFlushed('Buffer flush already requested')
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

      ['add', 'update', 'remove'].forEach(action => {
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

  _resolveItem (keyOrObjectWithId, valueIfKey = null) {
    let value
    let key = this.getId(keyOrObjectWithId)

    if (undefined === key) {
      if (arguments.length < 2) {
        throw new IllegalAdd('Missing value, or object value does not provide id/key')
      } else {
        key = keyOrObjectWithId
        value = valueIfKey
      }
    } else {
      value = keyOrObjectWithId
    }

    return [key, value]
  }

  _assertHas (key) {
    if (!this.has(key)) {
      throw new NoSuchItem('No ' + key + ' item')
    }
  }

  _assertHasNot (key) {
    if (this.has(key)) {
      throw new DuplicateItem('Attempt to duplicate ' + key + ' item')
    }
  }

  add (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHasNot(key)

    this._items[key] = value
    this._size++
    this._touch('add', key)

    return this
  }

  set (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)

    const action = this.has(key) ? 'update' : 'add'
    this._items[key] = value
    if (action === 'add') {
      this._size++
    }
    this._touch(action, key)

    return this
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

  update (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHas(key)

    this._items[key] = value
    this._touch('update', key)

    return this
  }

  touch (keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId, null)
    this._assertHas(key)
    const value = this.get(key)
    if (typeof value !== 'object' || value === null) {
      throw new IllegalTouch('Touching a scalar. Not an object')
    }

    this._touch('update', key)

    return this.get(key)
  }

  remove (keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId, null)
    this._assertHas(key)

    delete this._items[key]
    this._size--
    this._touch('remove', key)

    return this
  }

  clear () {
    for (let key in this._items) {
      delete this._items[key]
      this._size--
      this._touch('remove', key)
    }
    return this
  }

  get size () {
    return this._size
  }

  get all () {
    return this._items
  }
}
