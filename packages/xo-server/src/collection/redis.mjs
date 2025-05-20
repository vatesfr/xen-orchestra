import assert from 'assert'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import difference from 'lodash/difference.js'
import filter from 'lodash/filter.js'
import forEach from 'lodash/forEach.js'
import getKeys from 'lodash/keys.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import isEmpty from 'lodash/isEmpty.js'
import map from 'lodash/map.js'
import omit from 'lodash/omit.js'
import { v4 as generateUuid } from 'uuid'

import Collection, { ModelAlreadyExists } from '../collection.mjs'

// ===================================================================

// ///////////////////////////////////////////////////////////////////
// Data model:
// - 'xo::namespaces': set of all available namespaces
// - prefix + '::indexes': set containing all indexes;
// - prefix +'_ids': set containing identifier of all models;
// - prefix +'_'+ index +':' + lowerCase(value): set of identifiers
//   which have value for the given index.
// - prefix +':'+ id: hash containing the properties of a model;
// ///////////////////////////////////////////////////////////////////

// TODO: then-redis sends commands in order, we should use this
// semantic to simplify the code.

// TODO: Merge the options in the object to obtain extend-time
// configuration like Backbone.

// TODO: Remote events.

const VERSION = '20170905'

export default class Redis extends Collection {
  // Called before a new model is added
  //
  // If throws, the add operation is aborted
  async _beforeAdd(record) {}

  // Called before a model is updated
  //
  // If throws, the update operation is aborted
  async _beforeUpdate(record, previous) {}

  // Prepare a record before storing in the database
  //
  // Input object can be mutated or a new one returned
  _serialize(record) {}

  // Clean a record after being fetched from the database
  //
  // Input object can be mutated or a new one returned
  _unserialize(record) {}

  constructor({ connection, indexes = [], namespace }) {
    super()

    assert(!namespace.includes(':'), 'namespace must not contains ":": ' + namespace)
    assert(!namespace.includes('_'), 'namespace must not contains "_": ' + namespace)

    const prefix = 'xo:' + namespace

    this.indexes = indexes
    this.prefix = prefix
    const redis = (this.redis = connection)

    redis.sAdd('xo::namespaces', namespace)::ignoreErrors()

    const key = `${prefix}:version`
    redis
      .get(key)
      .then(version => {
        if (version === VERSION) {
          return
        }

        let p = redis.set(`${prefix}:version`, VERSION)
        switch (version) {
          case undefined:
            // - clean indexes
            // - indexes are now case insensitive
            p = p.then(() => this.rebuildIndexes())
        }
        return p
      })
      ::ignoreErrors()
  }

  async rebuildIndexes() {
    const { indexes, prefix, redis } = this

    await redis.del(`${prefix}::indexes`)

    if (indexes.length === 0) {
      return
    }

    await redis.sAdd(`${prefix}::indexes`, indexes)

    await asyncMapSettled(indexes, index =>
      redis.keys(`${prefix}_${index}:*`).then(keys => keys.length !== 0 && redis.del(keys))
    )

    const idsIndex = `${prefix}_ids`
    await asyncMapSettled(redis.sMembers(idsIndex), id => {
      return this.#get(`${prefix}:${id}`).then(values =>
        values == null
          ? redis.sRem(idsIndex, id) // entry no longer exists
          : asyncMapSettled(indexes, index => {
              const value = values[index]
              if (value !== undefined) {
                return redis.sAdd(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
              }
            })
      )
    })
  }

  _extract(ids) {
    const prefix = this.prefix + ':'

    const models = []
    return Promise.all(
      map(ids, id => {
        return this.#get(prefix + id).then(model => {
          if (model === undefined) {
            return
          }

          model = this._unserialize(model) ?? model

          // Mix the identifier in.
          model.id = id

          models.push(model)
        })
      })
    ).then(() => models)
  }

  _add(models, { replace = false } = {}) {
    // TODO: remove “replace” which is a temporary measure, implement
    // “set()” instead.

    const { indexes, prefix, redis } = this

    return Promise.all(
      map(models, async model => {
        // don't mutate param
        model = JSON.parse(JSON.stringify(model))

        // Generate a new identifier if necessary.
        let { id } = model
        if (id === undefined) {
          id = generateUuid()
        } else {
          // identifier is not stored as value in the database, it's already part of the key
          delete model.id
        }

        const newEntry = await redis.sAdd(prefix + '_ids', id)

        if (newEntry) {
          try {
            await this._beforeAdd(model)
          } catch (error) {
            await redis.sRem(prefix + '_ids', id)
            throw error
          }
        } else {
          if (!replace) {
            throw new ModelAlreadyExists(id)
          }

          const previous = await this.#get(`${prefix}:${id}`)
          await this._beforeUpdate(model, this._unserialize(previous) ?? previous)

          // remove the previous values from indexes
          if (indexes.length !== 0) {
            await asyncMapSettled(indexes, index => {
              const value = previous[index]
              if (value !== undefined) {
                return redis.sRem(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
              }
            })
          }
        }

        // allow specific serialization
        model = this._serialize(model) ?? model

        const key = `${prefix}:${id}`
        const promises = [redis.del(key), redis.set(key, JSON.stringify(model))]

        // Update indexes.
        forEach(indexes, index => {
          const value = model[index]
          if (value === undefined) {
            return
          }

          const key = prefix + '_' + index + ':' + String(value).toLowerCase()
          promises.push(redis.sAdd(key, id))
        })

        await Promise.all(promises)

        model = this._unserialize(model) ?? model
        model.id = id
        return model
      })
    )
  }

  /**
   * Fetches the record in the database
   *
   * Returns undefined if not present.
   */
  async #get(key) {
    const { redis } = this

    let model
    try {
      const json = await redis.get(key)

      if (json !== null) {
        model = JSON.parse(json)
      }
    } catch (error) {
      if (!error.message.startsWith('WRONGTYPE')) {
        throw error
      }

      model = await redis.hGetAll(key)
    }

    return model
  }

  _get(properties) {
    const { prefix, redis } = this

    if (isEmpty(properties)) {
      return redis.sMembers(prefix + '_ids').then(ids => this._extract(ids))
    }

    // Special treatment for the identifier.
    const id = properties.id
    if (id !== undefined) {
      properties = omit(properties, 'id')
      return this._extract([id]).then(models => {
        return models.length && !isEmpty(properties) ? filter(models, properties) : models
      })
    }

    const { indexes } = this

    // Check for non indexed fields.
    const unfit = difference(getKeys(properties), indexes)
    if (unfit.length) {
      throw new Error('fields not indexed: ' + unfit.join())
    }

    const keys = map(properties, (value, index) => `${prefix}_${index}:${String(value).toLowerCase()}`)
    return redis.sInter(keys).then(ids => this._extract(ids))
  }

  _remove(ids) {
    if (isEmpty(ids)) {
      return
    }

    const { indexes, prefix, redis } = this

    // update main index
    let promise = redis.sRem(prefix + '_ids', ids)

    // update other indexes
    if (indexes.length !== 0) {
      promise = Promise.all([
        promise,
        asyncMapSettled(ids, id =>
          this.#get(`${prefix}:${id}`).then(
            values =>
              values != null &&
              asyncMapSettled(indexes, index => {
                const value = values[index]
                if (value !== undefined) {
                  return redis.sRem(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
                }
              })
          )
        ),
      ])
    }

    return promise.then(() =>
      // remove the models
      redis.del(map(ids, id => `${prefix}:${id}`))
    )
  }

  _update(models) {
    return this._add(models, { replace: true })
  }
}
