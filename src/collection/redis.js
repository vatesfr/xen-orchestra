import { createClient as createRedisClient } from 'redis'
import { difference, filter, forEach, isEmpty, keys as getKeys, map } from 'lodash'
import { promisifyAll } from 'promise-toolbox'
import { v4 as generateUuid } from 'uuid'

import Collection, { ModelAlreadyExists } from '../collection'
import { asyncMap } from '../utils'

// ===================================================================

// ///////////////////////////////////////////////////////////////////
// Data model:
// - prefix +'_id': value of the last generated identifier;
// - prefix +'_ids': set containing identifier of all models;
// - prefix +'_'+ index +':' + value: set of identifiers which have
//   value for the given index.
// - prefix +':'+ id: hash containing the properties of a model;
// ///////////////////////////////////////////////////////////////////

// TODO: then-redis sends commands in order, we should use this
// semantic to simplify the code.

// TODO: Merge the options in the object to obtain extend-time
// configuration like Backbone.

// TODO: Remote events.

export default class Redis extends Collection {
  constructor ({
    connection,
    indexes = [],
    prefix,
    uri
  }) {
    super()

    this.indexes = indexes
    this.prefix = prefix
    this.redis = promisifyAll(connection || createRedisClient(uri))
  }

  rebuildIndexes () {
    const { indexes, prefix, redis } = this

    if (indexes.length === 0) {
      return Promise.resolve()
    }

    return asyncMap(indexes, index =>
      redis.keys(`${prefix}_${index}:*`).then(keys =>
        keys.length !== 0 && redis.del(keys)
      )
    ).then(() => asyncMap(redis.smembers(`${prefix}_ids`), id =>
      redis.hgetall(`${prefix}:${id}`).then(values =>
        asyncMap(indexes, index => {
          const value = values[index]
          if (value !== undefined) {
            return redis.sadd(`${prefix}_${index}:${value}`, id)
          }
        })
      )
    ))
  }

  _extract (ids) {
    const prefix = this.prefix + ':'
    const {redis} = this

    const models = []
    return Promise.all(map(ids, id => {
      return redis.hgetall(prefix + id).then(model => {
        // If empty, consider it a no match.
        if (isEmpty(model)) {
          return
        }

        // Mix the identifier in.
        model.id = id

        models.push(model)
      })
    })).then(() => models)
  }

  _add (models, {replace = false} = {}) {
    // TODO: remove “replace” which is a temporary measure, implement
    // “set()” instead.

    const {indexes, prefix, redis} = this

    return Promise.all(map(models, async model => {
      // Generate a new identifier if necessary.
      if (model.id === undefined) {
        model.id = generateUuid()
      }
      const { id } = model

      const success = await redis.sadd(prefix + '_ids', id)

      // The entry already exists an we are not in replace mode.
      if (!success && !replace) {
        throw new ModelAlreadyExists(id)
      }

      // TODO: Remove existing fields.

      // remove the previous values from indexes
      if (replace && indexes.length !== 0) {
        const previous = await redis.hgetall(`${prefix}:${id}`)
        await asyncMap(indexes, index => {
          const value = previous[index]
          if (value !== undefined) {
            return redis.srem(`${prefix}_${index}:${value}`, id)
          }
        })
      }

      const params = []
      forEach(model, (value, name) => {
        // No need to store the identifier (already in the key).
        if (name === 'id') {
          return
        }

        params.push(name, value)
      })

      const key = `${prefix}:${id}`
      const promises = [
        redis.del(key),
        redis.hmset(key, ...params)
      ]

      // Update indexes.
      forEach(indexes, (index) => {
        const value = model[index]
        if (value === undefined) {
          return
        }

        const key = prefix + '_' + index + ':' + value
        promises.push(redis.sadd(key, id))
      })

      await Promise.all(promises)

      return model
    }))
  }

  _get (properties) {
    const {prefix, redis} = this

    if (isEmpty(properties)) {
      return redis.smembers(prefix + '_ids').then(ids => this._extract(ids))
    }

    // Special treatment for the identifier.
    const id = properties.id
    if (id !== undefined) {
      delete properties.id
      return this._extract([id]).then(models => {
        return (models.length && !isEmpty(properties))
          ? filter(models)
          : models
      })
    }

    const {indexes} = this

    // Check for non indexed fields.
    const unfit = difference(getKeys(properties), indexes)
    if (unfit.length) {
      throw new Error('fields not indexed: ' + unfit.join())
    }

    const keys = map(properties, (value, index) => `${prefix}_${index}:${value}`)
    return redis.sinter(...keys).then(ids => this._extract(ids))
  }

  _remove (ids) {
    if (isEmpty(ids)) {
      return
    }

    const { indexes, prefix, redis } = this

    // update main index
    let promise = redis.srem(prefix + '_ids', ...ids)

    // update other indexes
    if (indexes.length !== 0) {
      promise = Promise.all([ promise, asyncMap(ids, id =>
        redis.hgetall(`${prefix}:${id}`).then(values =>
          asyncMap(indexes, index => {
            const value = values[index]
            if (value !== undefined) {
              return redis.srem(`${prefix}_${index}:${value}`, id)
            }
          })
        )
      ) ])
    }

    return promise.then(() =>
      // remove the models
      redis.del(map(ids, id => `${prefix}:${id}`))
    )
  }

  _update (models) {
    return this._add(models, { replace: true })
  }
}
