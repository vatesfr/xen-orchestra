import iteratee from 'lodash/iteratee'
import { EventEmitter } from 'node:events'

import clearObject from './clear-object'
import { ACTION_ADD, ACTION_UPDATE, ACTION_REMOVE } from './collection'

// ===================================================================

export class Index {
  #indexType

  constructor(indexType) {
    if (indexType === undefined) {
      throw new Error('indexType must be passed')
    }

    this.#indexType = typeof indexType === 'function' ? indexType : iteratee(indexType)

    this._itemsByType = Object.create(null)
    this._keysToType = Object.create(null)
    this._eeByType = Object.create(null)

    // Bound versions of listeners.
    this._onAdd = this._onAdd.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onRemove = this._onRemove.bind(this)

    this.getIndexType = this.getIndexType.bind(this)
  }

  getIndexType(object) {
    return this.#indexType(object)
  }

  // -----------------------------------------------------------------

  get items() {
    return this._itemsByType
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

    clearObject(this._itemsByType)
    clearObject(this._keysToType)
  }

  // -----------------------------------------------------------------

  _onAdd(items) {
    const { getIndexType, _itemsByType: itemsByType, _keysToType: keysToType } = this

    for (const key in items) {
      const value = items[key]

      const type = getIndexType(value)

      if (type != null) {
        ;(itemsByType[type] ||
          // FIXME: We do not use objects without prototype for now
          // because it breaks Angular in xo-web, change it back when
          // this is fixed.
          (itemsByType[type] = {}))[key] = value

        keysToType[key] = type
        this.getEventEmitterByType(type)?.emit('add', value)
      }
    }
  }

  _onUpdate(items) {
    const { getIndexType, _itemsByType: itemsByType, _keysToType: keysToType } = this

    for (const key in items) {
      const value = items[key]

      const prevType = keysToType[key]
      const previousObj = itemsByType[prevType]?.[key]
      const type = getIndexType(value)

      // Removes item from the previous type's list if any.
      if (prevType != null) delete itemsByType[prevType][key]

      // Inserts item into the new type's list if any.
      if (type != null) {
        ;(itemsByType[type] ||
          // FIXME: idem: change back to Object.create(null)
          (itemsByType[type] = {}))[key] = value

        keysToType[key] = type
        this.getEventEmitterByType(type)?.emit('update', value, previousObj)
      } else {
        delete keysToType[key]
      }
    }
  }

  _onRemove(items) {
    const { _itemsByType: itemsByType, _keysToType: keysToType } = this

    for (const key in items) {
      const prev = keysToType[key]
      if (prev != null) {
        this.getEventEmitterByType(prev)?.emit('remove', undefined, itemsByType[prev][key])
        delete itemsByType[prev][key]
        delete keysToType[key]
      }
    }
  }
}
