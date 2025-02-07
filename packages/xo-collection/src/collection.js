import kindOf from 'kindof'
import { BaseError } from 'make-error'
import { EventEmitter } from 'events'
import forOwn from 'lodash/forOwn.js'

import isEmpty from './is-empty'
import isObject from './is-object'

// ===================================================================

const {
  create: createObject,
  keys,
  prototype: { hasOwnProperty },
} = Object

export const ACTION_ADD = 'add'
export const ACTION_UPDATE = 'update'
export const ACTION_REMOVE = 'remove'

// ===================================================================

export class BufferAlreadyFlushed extends BaseError {
  constructor() {
    super('buffer flush already requested')
  }
}

export class DuplicateIndex extends BaseError {
  constructor(name) {
    super('there is already an index with the name ' + name)
  }
}

export class DuplicateItem extends BaseError {
  constructor(key) {
    super('there is already a item with the key ' + key)
  }
}

export class IllegalTouch extends BaseError {
  constructor(value) {
    super('only an object value can be touched (found a ' + kindOf(value) + ')')
  }
}

export class InvalidKey extends BaseError {
  constructor(key) {
    super('invalid key of type ' + kindOf(key))
  }
}

export class NoSuchIndex extends BaseError {
  constructor(name) {
    super('there is no index with the name ' + name)
  }
}

export class NoSuchItem extends BaseError {
  constructor(key) {
    super('there is no item with the key ' + key)
  }
}

// -------------------------------------------------------------------

const assertValidKey = key => {
  if (!isValidKey(key)) {
    throw new InvalidKey(key)
  }
}

const isValidKey = key => typeof key === 'number' || typeof key === 'string'

// -------------------------------------------------------------------

export class Collection extends EventEmitter {
  constructor() {
    super()

    this._buffer = createObject(null)
    this._buffering = 0
    this._indexes = createObject(null)
    this._indexedItems = createObject(null)
    this._items = createObject(null)
    this._size = 0
  }

  // Overridable method used to compute the key of an item when
  // unspecified.
  //
  // Default implementation returns the `id` property.
  getKey(value) {
    return value && value.id
  }

  // -----------------------------------------------------------------
  // Properties
  // -----------------------------------------------------------------

  get all() {
    return this._items
  }

  get indexes() {
    return this._indexedItems
  }

  get size() {
    return this._size
  }

  get allIndexes() {
    return this._indexes
  }

  // -----------------------------------------------------------------
  // Manipulation
  // -----------------------------------------------------------------

  add(keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHasNot(key)

    this._items[key] = value
    this._size++
    this._touch(ACTION_ADD, key)
  }

  clear() {
    keys(this._items).forEach(this._remove, this)
  }

  remove(keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId)
    this._assertHas(key)

    this._remove(key)
  }

  set(keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)

    const action = this.has(key) ? ACTION_UPDATE : ACTION_ADD
    this._items[key] = value
    if (action === ACTION_ADD) {
      this._size++
    }
    this._touch(action, key)
  }

  touch(keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId)
    this._assertHas(key)
    const value = this.get(key)
    if (!isObject(value)) {
      throw new IllegalTouch(value)
    }

    this._touch(ACTION_UPDATE, key)

    return this.get(key)
  }

  unset(keyOrObjectWithId) {
    const [key] = this._resolveItem(keyOrObjectWithId)

    if (this.has(key)) {
      this._remove(key)
    }
  }

  update(keyOrObjectWithId, valueIfKey = undefined) {
    const [key, value] = this._resolveItem(keyOrObjectWithId, valueIfKey)
    this._assertHas(key)

    this._items[key] = value
    this._touch(ACTION_UPDATE, key)
  }

  // -----------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------

  get(key, defaultValue) {
    if (this.has(key)) {
      return this._items[key]
    }

    if (arguments.length > 1) {
      return defaultValue
    }

    throw new NoSuchItem(key)
  }

  has(key) {
    return hasOwnProperty.call(this._items, key)
  }

  // -----------------------------------------------------------------
  // Indexes
  // -----------------------------------------------------------------

  createIndex(name, index) {
    const indexes = this._indexes
    if (hasOwnProperty.call(indexes, name)) {
      throw new DuplicateIndex(name)
    }

    indexes[name] = index
    this._indexedItems[name] = index.items

    index._attachCollection(this)
  }

  deleteIndex(name) {
    const indexes = this._indexes
    if (!hasOwnProperty.call(indexes, name)) {
      throw new NoSuchIndex(name)
    }

    const index = indexes[name]
    delete indexes[name]
    delete this._indexedItems[name]

    index._detachCollection(this)
  }

  // -----------------------------------------------------------------
  // Iteration
  // -----------------------------------------------------------------

  *[Symbol.iterator]() {
    const items = this._items

    for (const key in items) {
      yield [key, items[key]]
    }
  }

  *keys() {
    const items = this._items

    for (const key in items) {
      yield key
    }
  }

  *values() {
    const items = this._items

    for (const key in items) {
      yield items[key]
    }
  }

  // -----------------------------------------------------------------
  // Events buffering
  // -----------------------------------------------------------------

  bufferEvents() {
    ++this._buffering

    let called = false
    return () => {
      if (called) {
        throw new BufferAlreadyFlushed()
      }
      called = true

      if (--this._buffering !== 0) {
        return
      }

      const buffer = this._buffer

      // Due to deduplication there could be nothing in the buffer.
      if (isEmpty(buffer)) {
        return
      }

      const data = {
        add: createObject(null),
        remove: createObject(null),
        update: createObject(null),
      }

      for (const key in this._buffer) {
        data[buffer[key]][key] = this._items[key]
      }

      forOwn(data, (items, action) => {
        if (!isEmpty(items)) {
          this.emit(action, items)
        }
      })

      // Indicates the end of the update.
      //
      // This name has been chosen because it is used in Node writable
      // streams when the data has been successfully committed.
      this.emit('finish')

      this._buffer = createObject(null)
    }
  }

  // =================================================================

  _assertHas(key) {
    if (!this.has(key)) {
      throw new NoSuchItem(key)
    }
  }

  _assertHasNot(key) {
    if (this.has(key)) {
      throw new DuplicateItem(key)
    }
  }

  _remove(key) {
    delete this._items[key]
    this._size--
    this._touch(ACTION_REMOVE, key)
  }

  _resolveItem(keyOrObjectWithId, valueIfKey = undefined) {
    if (valueIfKey !== undefined) {
      assertValidKey(keyOrObjectWithId)

      return [keyOrObjectWithId, valueIfKey]
    }

    if (isValidKey(keyOrObjectWithId)) {
      return [keyOrObjectWithId]
    }

    const key = this.getKey(keyOrObjectWithId)
    assertValidKey(key)

    return [key, keyOrObjectWithId]
  }

  _touch(action, key) {
    if (this._buffering === 0) {
      const flush = this.bufferEvents()

      process.nextTick(flush)
    }

    if (action === ACTION_ADD) {
      this._buffer[key] = key in this._buffer ? ACTION_UPDATE : ACTION_ADD
    } else if (action === ACTION_REMOVE) {
      if (this._buffer[key] === ACTION_ADD) {
        delete this._buffer[key]
      } else {
        this._buffer[key] = ACTION_REMOVE
      }
    } else {
      // update
      if (!(key in this._buffer)) {
        this._buffer[key] = ACTION_UPDATE
      }
    }
  }
}
