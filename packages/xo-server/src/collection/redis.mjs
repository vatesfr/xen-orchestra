import assert from 'assert'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import difference from 'lodash/difference.js'
import filter from 'lodash/filter.js'
import getKeys from 'lodash/keys.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import isEmpty from 'lodash/isEmpty.js'
import map from 'lodash/map.js'
import omit from 'lodash/omit.js'
import { v4 as generateUuid } from 'uuid'

import Collection, { ModelAlreadyExists } from '../collection.mjs'

/** @typedef {import('../xo-mixins/crypto-credentials.mjs').default} CryptoCredentials */

// ===================================================================

// ///////////////////////////////////////////////////////////////////
// Data model:
// - 'xo::namespaces': set of all available namespaces
// - prefix + '::indexes': set containing all indexes;
// - prefix +'_ids': set containing identifier of all models;
// - prefix +'_'+ index +':' + lowerCase(value): set of identifiers
//   which have value for the given index. Value is an HMAC when crypto is active
// - prefix +':'+ id: hash containing the properties of a model;
// ///////////////////////////////////////////////////////////////////

// TODO: then-redis sends commands in order, we should use this
// semantic to simplify the code.

// TODO: Merge the options in the object to obtain extend-time
// configuration like Backbone.

// TODO: Remote events.

const VERSION = '20170905'

export default class Redis extends Collection {
  /** @type {CryptoCredentials | undefined} */
  #crypto

  get crypto() {
    return this.#crypto
  }

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

  constructor({ connection, indexes = [], namespace, crypto }) {
    super()

    assert(!namespace.includes(':'), 'namespace must not contains ":": ' + namespace)
    assert(!namespace.includes('_'), 'namespace must not contains "_": ' + namespace)

    const prefix = 'xo:' + namespace

    this.indexes = indexes
    this.prefix = prefix
    const redis = (this.redis = connection)
    this.#crypto = crypto

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
            // - indexes are now case-insensitive
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
    await asyncMapSettled(redis.sMembers(idsIndex), async id => {
      return this.#get(`${prefix}:${id}`).then(values =>
        values == null
          ? redis.sRem(idsIndex, id) // entry no longer exists
          : asyncMapSettled(indexes, async index => {
              let value = values[index]
              if (value !== undefined) {
                if (this.#crypto && !this.#crypto.isDegraded()) {
                  value = await this.#crypto.hmacIndex(String(value).toLowerCase())
                } else {
                  value = String(value).toLowerCase()
                }

                return redis.sAdd(`${prefix}_${index}:${value}`, id)
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
          if (previous !== undefined) {
            await this._beforeUpdate(model, this._unserialize(previous) ?? previous)

            // remove the previous values from indexes
            if (indexes.length !== 0) {
              await asyncMapSettled(indexes, async index => {
                let value = previous[index]
                if (value !== undefined) {
                  if (this.#crypto && !this.#crypto.isDegraded()) {
                    value = await this.#crypto.hmacIndex(String(value).toLowerCase())
                  } else {
                    value = String(value).toLowerCase()
                  }

                  return redis.sRem(`${prefix}_${index}:${value}`, id)
                }
              })
            }
          }
        }

        // allow specific serialization
        model = this._serialize(model) ?? model

        const key = `${prefix}:${id}`
        let serialized = JSON.stringify(model)
        if (this.#crypto && !this.#crypto.isDegraded()) {
          serialized = await this.#crypto.encrypt(serialized)
        }

        await redis.del(key)
        await redis.set(key, serialized)

        // Update indexes.
        await asyncMapSettled(indexes, async index => {
          let value = model[index]
          if (value === undefined) return

          if (this.#crypto && !this.#crypto.isDegraded()) {
            value = await this.#crypto.hmacIndex(String(value).toLowerCase())
          } else {
            value = String(value).toLowerCase()
          }

          return redis.sAdd(`${prefix}_${index}:${value}`, id)
        })

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
        if (this.#crypto && !this.#crypto.isDegraded()) {
          model = JSON.parse(await this.#crypto.decrypt(json))
        } else {
          model = JSON.parse(json)
        }
      }
    } catch (error) {
      if (!error.message.startsWith('WRONGTYPE')) {
        throw error
      }

      model = await redis.hGetAll(key)
    }

    return model
  }

  async _get(properties) {
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

    const keys = await Promise.all(
      map(properties, async (value, index) => {
        if (this.#crypto && !this.#crypto.isDegraded()) {
          value = await this.#crypto.hmacIndex(String(value).toLowerCase())
        } else {
          value = String(value).toLowerCase()
        }

        return `${prefix}_${index}:${value}`
      })
    )
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
        asyncMapSettled(ids, async id =>
          this.#get(`${prefix}:${id}`).then(
            values =>
              values != null &&
              asyncMapSettled(indexes, async index => {
                let value = values[index]
                if (value !== undefined) {
                  if (this.#crypto && !this.#crypto.isDegraded()) {
                    value = await this.#crypto.hmacIndex(String(value).toLowerCase())
                  } else {
                    value = String(value).toLowerCase()
                  }

                  return redis.sRem(`${prefix}_${index}:${value}`, id)
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
