import bind from 'lodash.bind'
import callback from 'lodash.callback'

import clearObject from './clear-object'
import isEmpty from './is-empty'
import NotImplemented from './not-implemented'

// ===================================================================

export default class Index {
  constructor (computeHash) {
    if (computeHash) {
      this.computeHash = callback(computeHash)
    }

    this._itemsByHash = Object.create(null)
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

  // Remove empty items lists.
  sweep () {
    const {_itemsByHash: itemsByHash} = this
    for (let hash in itemsByHash) {
      if (isEmpty(itemsByHash[hash])) {
        delete itemsByHash[hash]
      }
    }
  }

  // -----------------------------------------------------------------

  get items () {
    return this._itemsByHash
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

    clearObject(this._itemsByHash)
    clearObject(this._keysToHash)
  }

  // -----------------------------------------------------------------

  _onAdd (items) {
    const {
      computeHash,
      _itemsByHash: itemsByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const value = items[key]

      const hash = computeHash(value, key)

      if (hash != null) {
        (
          itemsByHash[hash] ||

          // FIXME: We do not use objects without prototype for now
          // because it breaks Angular in xo-web, change it back when
          // this is fixed.
          (itemsByHash[hash] = {})
        )[key] = value

        keysToHash[key] = hash
      }
    }
  }

  _onUpdate (items) {
    const {
      computeHash,
      _itemsByHash: itemsByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const value = items[key]

      const prev = keysToHash[key]
      const hash = computeHash(value, key)

      // Removes item from the previous hash's list if any.
      if (prev != null) delete itemsByHash[prev][key]

      // Inserts item into the new hash's list if any.
      if (hash != null) {
        (
          itemsByHash[hash] ||

          // FIXME: idem: change back to Object.create(null)
          (itemsByHash[hash] = {})
        )[key] = value

        keysToHash[key] = hash
      } else {
        delete keysToHash[key]
      }
    }
  }

  _onRemove (items) {
    const {
      _itemsByHash: itemsByHash,
      _keysToHash: keysToHash
    } = this

    for (let key in items) {
      const prev = keysToHash[key]
      if (prev != null) {
        delete itemsByHash[prev][key]
        delete keysToHash[key]
      }
    }
  }
}
