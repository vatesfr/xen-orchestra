import events from 'events'
import makeError from 'make-error'

export const BufferAlreadyFlushed = makeError('BufferAlreadyFlushed')
export const DuplicateEntry = makeError('DuplicateEntry')
export const IllegalAdd = makeError('IllegalAdd')
export const IllegalTouch = makeError('IllegalTouch')
export const NoSuchEntry = makeError('NoSuchEntry')

export default class Collection extends events.EventEmitter {
  constructor () {
    super()

    this._buffering = 0
    this._map = Object.create(null)
    this._size = 0
  }

  bufferChanges () {
    if (this._buffering++ === 0) {
      this._buffer = Object.create(null)
    }

    let called = false
    return () => {
      if (called) {
        throw new BufferAlreadyFlushed('Buffer flush already requested')
      }
      called = true

      if (--this._buffering > 0) {
        return
      }

      const data = {
        add: {data: {}},
        remove: {data: {}},
        update: {data: {}}
      }

      for (let key in this._buffer) {
        data[this._buffer[key]].data[key] = this.has(key) ?
          this.get(key) :
          null // "remove" case
        data[this._buffer[key]].has = true
      }

      ['add', 'update', 'remove'].forEach(action => {
        if (data[action].has) {
          this.emit(action, data[action].data)
        }
      })

      delete this._buffer
    }
  }

  _touch (action, key) {
    if (this._buffering === 0) {
      process.nextTick(this.bufferChanges())
    }
    switch (action) {
      case 'add':
        this._buffer[key] = this._buffer[key] ? 'update' : 'add'
        break
      case 'remove':
        switch (this._buffer[key]) {
          case undefined:
          case 'update':
            this._buffer[key] = 'remove'
            break
          case 'add':
            delete this._buffer[key]
            break
        }
        break
      case 'update':
        this._buffer[key] = this._buffer[key] || 'update'
        break
    }
  }

  getId (item) {
    return item.id
  }

  has (key) {
    return Object.hasOwnProperty.call(this._map, key)
  }

  _resolveEntry (keyOrObjectWithId, valueIfKey = null) {
    let value
    let key = (undefined !== keyOrObjectWithId) ?
      this.getId(keyOrObjectWithId) :
      undefined

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
      throw new NoSuchEntry('No ' + key + ' entry')
    }
  }

  _assertHasNot (key) {
    if (this.has(key)) {
      throw new DuplicateEntry('Attempt to duplicate ' + key + ' entry')
    }
  }

  add (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveEntry.apply(this, arguments)
    this._assertHasNot(key)

    this._map[key] = value
    this._size++
    this._touch('add', key)

    return this
  }

  set (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveEntry.apply(this, arguments)

    const action = this.has(key) ? 'update' : 'add'
    this._map[key] = value
    if (action === 'add') {
      this._size++
    }
    this._touch(action, key)

    return this
  }

  get (key, defaultValue) {
    if (arguments.length > 1 && !this.has(key)) {
      return defaultValue
    }
    this._assertHas(key)
    return this._map[key]
  }

  update (keyOrObjectWithId, valueIfKey = null) {
    const [key, value] = this._resolveEntry.apply(this, arguments)
    this._assertHas(key)

    this._map[key] = value
    this._touch('update', key)

    return this
  }

  touch (keyOrObjectWithId) {
    const [key] = this._resolveEntry(keyOrObjectWithId, null)
    this._assertHas(key)
    const value = this.get(key)
    if (typeof value !== 'object' || value === null) {
      throw new IllegalTouch('Touching a scalar. Not an object')
    }

    this._touch('update', key)

    return this.get(key)
  }

  remove (keyOrObjectWithId) {
    const [key] = this._resolveEntry(keyOrObjectWithId, null)
    this._assertHas(key)

    delete this._map[key]
    this._size--
    this._touch('remove', key)

    return this
  }

  clear () {
    for (let key in this._map) {
      delete this._map[key]
      this._size--
      this._touch('remove', key)
    }
    return this
  }

  get size () {
    return this._size
  }

  get all () {
    return this._map
  }
}
