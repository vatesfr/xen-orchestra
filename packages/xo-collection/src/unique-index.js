import bind from 'lodash.bind'
import callback from 'lodash.callback'

import clearObject from './clear-object'
import NotImplemented from './not-implemented'

// ===================================================================

export default class UniqueIndex {
  constructor (computeHash) {
    if (computeHash) {
      this.computeHash = callback(computeHash)
    }

    this._itemByHash = Object.create(null)
    this._keysToHash = Object.create(null)

    // Bound versions of listeners.
    this._onAdd = bind(this._onAdd, this)
    this._onUpdate = bind(this._onUpdate, this)
    this._onRemove = bind(this._onRemove, this)
  }

  // This method is used to compute the hash under which an item must
  // be saved.
  computeHash (value, key) {
    throw new NotImplemented('this method must be overridden')
  }

  // -----------------------------------------------------------------

  get items () {
    return this._itemByHash
  }

  // -----------------------------------------------------------------

  _attachCollection (collection) {
    // Add existing entries.
    //
    // FIXME: I think there may be a race condition if the `add` event
    // has not been emitted yet.
    this._onAdd(collection.all)

    collection.on('add', this._onAdd)
    collection.on('update', this._onUpdate)
    collection.on('remove', this._onRemove)
  }

  _detachCollection (collection) {
    collection.removeListener('add', this._onAdd)
    collection.removeListener('update', this._onUpdate)
    collection.removeListener('remove', this._onRemove)

    clearObject(this._itemByHash)
    clearObject(this._keysToHash)
  }

  // -----------------------------------------------------------------

  _onAdd (items) {
    const {
      computeHash,
      _itemByHash: itemByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const value = items[key]

      const hash = computeHash(value, key)

      if (hash != null) {
        itemByHash[hash] = value
        keysToHash[key] = hash
      }
    }
  }

  _onUpdate (items) {
    const {
      computeHash,
      _itemByHash: itemByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const value = items[key]

      const prev = keysToHash[key]
      const hash = computeHash(value, key)

      // Same hash, nothing to do.
      if (hash === prev) continue

      // Removes item from the previous hash's list if any.
      if (prev != null) delete itemByHash[prev]

      // Inserts item into the new hash's list if any.
      if (hash != null) {
        itemByHash[hash] = value
        keysToHash[key] = hash
      } else {
        delete keysToHash[key]
      }
    }
  }

  _onRemove (items) {
    const {
      _itemByHash: itemByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const prev = keysToHash[key]
      if (prev != null) {
        delete itemByHash[prev]
        delete keysToHash[key]
      }
    }
  }
}
