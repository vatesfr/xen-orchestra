import iteratee from 'lodash/iteratee'
import { EventEmitter } from 'node:events'

import clearObject from './clear-object'
import isEmpty from './is-empty'
import NotImplemented from './not-implemented'
import { ACTION_ADD, ACTION_UPDATE, ACTION_REMOVE } from './collection'
// ===================================================================

export class Index {
  constructor(computeHash) {
    if (computeHash) {
      this.computeHash = iteratee(computeHash)
    }

    this._itemsByHash = Object.create(null)
    this._keysToHash = Object.create(null)
    this._eeByType = Object.create(null)

    // Bound versions of listeners.
    this._onAdd = this._onAdd.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onRemove = this._onRemove.bind(this)
  }

  // This method is used to compute the hash under which an item must
  // be saved.
  computeHash(value, key) {
    throw new NotImplemented('this method must be overridden')
  }

  // Remove empty items lists.
  sweep() {
    const { _itemsByHash: itemsByHash, _eeByType } = this
    for (const hash in itemsByHash) {
      if (isEmpty(itemsByHash[hash])) {
        delete itemsByHash[hash]
        delete _eeByType[hash]
      }
    }
  }

  // -----------------------------------------------------------------

  get items() {
    return this._itemsByHash
  }

  getEventEmitterByType(type) {
    if (type === undefined) {
      throw new Error('type is required')
    }

    if (this._eeByType[type] === undefined) {
      this._eeByType[type] = new EventEmitter()
    }

    return this._eeByType[type]
  }

  // -----------------------------------------------------------------

  _attachCollection(collection) {
    // Add existing entries.
    //
    // FIXME: I think there may be a race condition if the `add` event
    // has not been emitted yet.
    this._onAdd(collection.all)

    collection.on(ACTION_ADD, this._onAdd)
    collection.on(ACTION_UPDATE, this._onUpdate)
    collection.on(ACTION_REMOVE, this._onRemove)
  }

  _detachCollection(collection) {
    collection.removeListener(ACTION_ADD, this._onAdd)
    collection.removeListener(ACTION_UPDATE, this._onUpdate)
    collection.removeListener(ACTION_REMOVE, this._onRemove)

    clearObject(this._itemsByHash)
    clearObject(this._keysToHash)
  }

  // -----------------------------------------------------------------

  _onAdd(items) {
    const { computeHash, _itemsByHash: itemsByHash, _keysToHash: keysToHash } = this

    for (const key in items) {
      const value = items[key]

      const hash = computeHash(value, key)

      if (hash != null) {
        ;(itemsByHash[hash] ||
          // FIXME: We do not use objects without prototype for now
          // because it breaks Angular in xo-web, change it back when
          // this is fixed.
          (itemsByHash[hash] = {}))[key] = value

        keysToHash[key] = hash
        this.getEventEmitterByType(hash)?.emit('add', value)
      }
    }
  }

  _onUpdate(items) {
    const { computeHash, _itemsByHash: itemsByHash, _keysToHash: keysToHash } = this

    for (const key in items) {
      const value = items[key]

      const prev = keysToHash[key]
      const previousObj = itemsByHash[prev]?.[key]
      const hash = computeHash(value, key)

      // Removes item from the previous hash's list if any.
      if (prev != null) delete itemsByHash[prev][key]

      // Inserts item into the new hash's list if any.
      if (hash != null) {
        ;(itemsByHash[hash] ||
          // FIXME: idem: change back to Object.create(null)
          (itemsByHash[hash] = {}))[key] = value

        keysToHash[key] = hash
        this.getEventEmitterByType(hash)?.emit('update', value, previousObj)
      } else {
        delete keysToHash[key]
      }
    }
  }

  _onRemove(items) {
    const { _itemsByHash: itemsByHash, _keysToHash: keysToHash } = this

    for (const key in items) {
      const prev = keysToHash[key]
      if (prev != null) {
        this.getEventEmitterByType(prev)?.emit('remove', undefined, itemsByHash[prev][key])
        delete itemsByHash[prev][key]
        delete keysToHash[key]
      }
    }
  }
}
