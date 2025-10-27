import iteratee from 'lodash/iteratee'

import clearObject from './clear-object'
import { ACTION_ADD, ACTION_UPDATE, ACTION_REMOVE } from './collection'

// ===================================================================

export class UniqueIndex {
  #indexRef

  constructor(indexRef) {
    if (indexRef === undefined) {
      throw new Error('indexRef must be passed')
    }

    this.#indexRef = typeof indexRef === 'function' ? indexRef : iteratee(indexRef)

    this._itemByRef = Object.create(null)
    this._keysToRef = Object.create(null)

    // Bound versions of listeners.
    this._onAdd = this._onAdd.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onRemove = this._onRemove.bind(this)

    this.getIndexRef = this.getIndexRef.bind(this)
  }

  getIndexRef(object) {
    return this.#indexRef(object)
  }

  // -----------------------------------------------------------------

  get items() {
    return this._itemByRef
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

    clearObject(this._itemByRef)
    clearObject(this._keysToRef)
  }

  // -----------------------------------------------------------------

  _onAdd(items) {
    const { getIndexRef, _itemByRef: itemByRef, _keysToRef: keysToRef } = this

    for (const key in items) {
      const value = items[key]

      const ref = getIndexRef(value)

      if (ref != null) {
        itemByRef[ref] = value
        keysToRef[key] = ref
      }
    }
  }

  _onUpdate(items) {
    const { getIndexRef, _itemByRef: itemByRef, _keysToRef: keysToRef } = this

    for (const key in items) {
      const value = items[key]

      const prevRef = keysToRef[key]
      const ref = getIndexRef(value)

      // Removes item from the previous ref's list if any.
      if (prevRef != null) delete itemByRef[prevRef]

      // Inserts item into the new ref's list if any.
      if (ref != null) {
        itemByRef[ref] = value
        keysToRef[key] = ref
      } else {
        delete keysToRef[key]
      }
    }
  }

  _onRemove(items) {
    const { _itemByRef: itemByRef, _keysToRef: keysToRef } = this

    for (const key in items) {
      const prevRef = keysToRef[key]
      if (prevRef != null) {
        delete itemByRef[prevRef]
        delete keysToRef[key]
      }
    }
  }
}
