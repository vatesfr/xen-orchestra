import assert from 'assert'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import difference from 'lodash/difference.js'
import filter from 'lodash/filter.js'
import forEach from 'lodash/forEach.js'
import getKeys from 'lodash/keys.js'
import isEmpty from 'lodash/isEmpty.js'
import map from 'lodash/map.js'
import omit from 'lodash/omit.js'
import { createClient as createRedisClient } from 'redis'
import { ignoreErrors, promisifyAll } from 'promise-toolbox'
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
  constructor({ connection, indexes = [], namespace, uri }) {
    super()

    assert(!namespace.includes(':'), 'namespace must not contains ":": ' + namespace)
    assert(!namespace.includes('_'), 'namespace must not contains "_": ' + namespace)

    const prefix = 'xo:' + namespace

    this.indexes = indexes
    this.prefix = prefix
    const redis = (this.redis = promisifyAll(connection || createRedisClient(uri)))

    redis.sadd('xo::namespaces', namespace)::ignoreErrors()

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

    await redis.sadd(`${prefix}::indexes`, indexes)

    await pEach(
      indexes,
      index => redis.keys(`${prefix}_${index}:*`).then(keys => keys.length !== 0 && redis.del(keys)),
      { stopOnError: false }
    )

    const idsIndex = `${prefix}_ids`
    await pEach(
      redis.smembers(idsIndex),
      id =>
        redis.hgetall(`${prefix}:${id}`).then(values =>
          values == null
            ? redis.srem(idsIndex, id) // entry no longer exists
            : pEach(
                indexes,
                index => {
                  const value = values[index]
                  if (value !== undefined) {
                    return redis.sadd(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
                  }
                },
                { stopOnError: false }
              )
        ),
      { stopOnError: false }
    )
  }

  _extract(ids) {
    const prefix = this.prefix + ':'
    const { redis } = this

    const models = []
    return Promise.all(
      map(ids, id => {
        return redis.hgetall(prefix + id).then(model => {
          // If empty, consider it a no match.
          if (isEmpty(model)) {
            return
          }

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
        // Generate a new identifier if necessary.
        if (model.id === undefined) {
          model.id = generateUuid()
        }
        const { id } = model

        const newEntry = await redis.sadd(prefix + '_ids', id)

        if (!newEntry) {
          if (!replace) {
            throw new ModelAlreadyExists(id)
          }

          // remove the previous values from indexes
          if (indexes.length !== 0) {
            const previous = await redis.hgetall(`${prefix}:${id}`)
            await pEach(
              indexes,
              index => {
                const value = previous[index]
                if (value !== undefined) {
                  return redis.srem(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
                }
              },
              { stopOnError: false }
            )
          }
        }

        const params = []
        forEach(model, (value, name) => {
          // No need to store the identifier (already in the key).
          if (name === 'id') {
            return
          }

          if (value !== undefined) {
            params.push(name, value)
          }
        })

        const key = `${prefix}:${id}`
        const promises = [redis.del(key), redis.hmset(key, ...params)]

        // Update indexes.
        forEach(indexes, index => {
          const value = model[index]
          if (value === undefined) {
            return
          }

          const key = prefix + '_' + index + ':' + String(value).toLowerCase()
          promises.push(redis.sadd(key, id))
        })

        await Promise.all(promises)

        return model
      })
    )
  }

  _get(properties) {
    const { prefix, redis } = this

    if (isEmpty(properties)) {
      return redis.smembers(prefix + '_ids').then(ids => this._extract(ids))
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
    return redis.sinter(...keys).then(ids => this._extract(ids))
  }

  _remove(ids) {
    if (isEmpty(ids)) {
      return
    }

    const { indexes, prefix, redis } = this

    // update main index
    let promise = redis.srem(prefix + '_ids', ...ids)

    // update other indexes
    if (indexes.length !== 0) {
      promise = Promise.all([
        promise,
        pEach(
          ids,
          id =>
            redis.hgetall(`${prefix}:${id}`).then(
              values =>
                values != null &&
                pEach(
                  indexes,
                  index => {
                    const value = values[index]
                    if (value !== undefined) {
                      return redis.srem(`${prefix}_${index}:${String(value).toLowerCase()}`, id)
                    }
                  },
                  { stopOnError: false }
                )
            ),
          { stopOnError: false }
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
