import { BaseError } from 'make-error'
import { EventEmitter } from 'events'
import { isObject } from './utils.mjs'

// ===================================================================

export class ModelAlreadyExists extends BaseError {
  constructor(id) {
    super('this model already exists: ' + id)
  }
}

// ===================================================================

export default class Collection extends EventEmitter {
  async add(models, opts) {
    const array = Array.isArray(models)
    if (!array) {
      models = [models]
    }

    models = await this._add(models, opts)
    this.emit('add', models)

    return array ? models : models[0]
  }

  async first(properties) {
    if (!isObject(properties)) {
      properties = properties !== undefined ? { id: properties } : {}
    }

    return await this._first(properties)
  }

  async get(properties) {
    if (!isObject(properties)) {
      properties = properties !== undefined ? { id: properties } : {}
    }

    return /* await */ this._get(properties)
  }

  // remove(id: string)
  // remove(ids: string[])
  // remove(properties: object)
  async remove(properties) {
    let ids
    if (typeof properties === 'object') {
      if (Array.isArray(properties)) {
        ids = properties
      } else {
        ids = (await this.get(properties)).map(_ => _.id)
        if (ids.length === 0) {
          return false
        }
      }
    } else {
      ids = [properties]
    }

    await this._remove(ids)

    this.emit('remove', ids)

    // FIXME: returns false if some ids were not removed
    return true
  }

  async update(models) {
    const array = Array.isArray(models)
    if (!array) {
      models = [models]
    }

    models.forEach(model => {
      // Missing models should be added not updated.
      if (model.id === undefined) {
        // FIXME: should not throw an exception but return a rejected promise.
        throw new Error('a model without an id cannot be updated')
      }
    })

    models = await this._update(models)
    this.emit('update', models)

    return array ? models : models[0]
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
