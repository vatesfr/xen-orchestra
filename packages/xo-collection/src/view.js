import bind from 'lodash.bind'
import createCallback from 'lodash.callback'
import forEach from 'lodash.foreach'

import Collection from './collection'

// ===================================================================

export default class View extends Collection {
  constructor (collection, predicate) {
    super()

    this._collection = collection
    this._predicate = createCallback(predicate)

    // Handles initial items.
    this._onAdd(this._collection.all)

    // Bound versions of listeners.
    this._onAdd = bind(this._onAdd, this)
    this._onUpdate = bind(this._onUpdate, this)
    this._onRemove = bind(this._onRemove, this)

    // Register listeners.
    this._collection.on('add', this._onAdd)
    this._collection.on('update', this._onUpdate)
    this._collection.on('remove', this._onRemove)
  }

  // This method is necessary to free the memory of the view if its
  // life span is shorter than the collection.
  destroy () {
    this._collection.removeListener('add', this._onAdd)
    this._collection.removeListener('update', this._onUpdate)
    this._collection.removeListener('remove', this._onRemove)
  }

  add () {
    throw new Error('a view is read only')
  }

  clear () {
    throw new Error('a view is read only')
  }

  set () {
    throw new Error('a view is read only')
  }

  update () {
    throw new Error('a view is read only')
  }

  _onAdd (items) {
    const {_predicate: predicate} = this

    forEach(items, (value, key) => {
      if (predicate(value, key, this)) {
        // super.add() cannot be used because the item may already be
        // in the view if it was already present at the creation of
        // the view and its event not already emitted.
        super.set(key, value)
      }
    })
  }

  _onUpdate (items) {
    const {_predicate: predicate} = this

    forEach(items, (value, key) => {
      if (predicate(value, key, this)) {
        super.set(key, value)
      } else if (super.has(key)) {
        super.remove(key)
      }
    })
  }

  _onRemove (items) {
    forEach(items, (value, key) => {
      if (super.has(key)) {
        super.remove(key)
      }
    })
  }
}
