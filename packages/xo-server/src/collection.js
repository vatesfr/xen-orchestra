import Model from './model'
import { BaseError } from 'make-error'
import { EventEmitter } from 'events'
import { isObject, map } from './utils'

// ===================================================================

export class ModelAlreadyExists extends BaseError {
  constructor(id) {
    super('this model already exists: ' + id)
  }
}

// ===================================================================

export default class Collection extends EventEmitter {
  // Default value for Model.
  get Model() {
    return Model
  }

  // Make this property writable.
  set Model(Model) {
    Object.defineProperty(this, 'Model', {
      configurable: true,
      enumerale: true,
      value: Model,
      writable: true,
    })
  }

  async add(models, opts) {
    const array = Array.isArray(models)
    if (!array) {
      models = [models]
    }

    const { Model } = this
    map(models, model => (model instanceof Model ? model.properties : model), models)

    models = await this._add(models, opts)
    this.emit('add', models)

    return array ? models : new this.Model(models[0])
  }

  async first(properties) {
    if (!isObject(properties)) {
      properties = properties !== undefined ? { id: properties } : {}
    }

    const model = await this._first(properties)
    return model && new this.Model(model)
  }

  async get(properties) {
    if (!isObject(properties)) {
      properties = properties !== undefined ? { id: properties } : {}
    }

    return /* await */ this._get(properties)
  }

  async remove(ids) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    await this._remove(ids)

    this.emit('remove', ids)
    return true
  }

  async update(models) {
    const array = Array.isArray(models)
    if (!array) {
      models = [models]
    }

    const { Model } = this
    map(
      models,
      model => {
        if (!(model instanceof Model)) {
          // TODO: Problems, we may be mixing in some default
          // properties which will overwrite existing ones.
          model = new Model(model)
        }

        const id = model.get('id')

        // Missing models should be added not updated.
        if (id === undefined) {
          // FIXME: should not throw an exception but return a rejected promise.
          throw new Error('a model without an id cannot be updated')
        }

        return model.properties
      },
      models
    )

    models = await this._update(models)
    this.emit('update', models)

    return array ? models : new this.Model(models[0])
  }

  // Methods to override in implementations.

  _add() {
    throw new Error('not implemented')
  }

  _get() {
    throw new Error('not implemented')
  }

  _remove() {
    throw new Error('not implemented')
  }

  _update() {
    throw new Error('not implemented')
  }

  // Methods which may be overridden in implementations.

  count(properties) {
    return this.get(properties).get('count')
  }

  exists(properties) {
    return this.first(properties).then(model => model !== undefined)
  }

  async _first(properties) {
    const models = await this.get(properties)

    return models.length ? models[0] : undefined
  }
}
