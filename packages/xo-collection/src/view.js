import bind from 'lodash.bind'
import createCallback from 'lodash.callback'
import forEach from 'lodash.foreach'

import Collection from './'

// ===================================================================

export default class View extends Collection {
  constructor (collection, predicate, thisArg) {
    super()

    this._collection = collection
    this._predicate = createCallback(predicate, thisArg)

    // Bound versions of listeners.
    this._onAdd = bind(this._onAdd, this)
    this._onUpdate = bind(this._onUpdate, this)
    this._onRemove = bind(this._onRemove, this)

    // Register listeners.
    this._collection.on('add', this._onAdd)
    this._collection.on('update', this._onUpdate)
    this._collection.on('remove', this._onRemove)
  }

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
        super.add(key, value)
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
