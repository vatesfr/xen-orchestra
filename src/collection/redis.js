import Bluebird from 'bluebird'
import Collection, {ModelAlreadyExists} from '../collection'
import difference from 'lodash.difference'
import filter from 'lodash.filter'
import getKey from 'lodash.keys'
import {createClient as createRedisClient, RedisClient, Multi} from 'redis'

import {
  forEach,
  isEmpty,
  mapToArray,
  promisifyAll
} from '../utils'

// ===================================================================

promisifyAll(RedisClient.prototype)
promisifyAll(Multi.prototype)

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
    uri = 'tcp://localhost:6379'
  }) {
    super()

    this.indexes = indexes
    this.prefix = prefix
    this.redis = connection || createRedisClient(uri)
  }

  _extract (ids) {
    const prefix = this.prefix + ':'
    const {redis} = this

    const models = []
    return Bluebird.map(ids, id => {
      return redis.hgetallAsync(prefix + id).then(model => {
        // If empty, consider it a no match.
        if (isEmpty(model)) {
          return
        }

        // Mix the identifier in.
        model.id = id

        models.push(model)
      })
    }).return(models)
  }

  _add (models, {replace = false} = {}) {
    // TODO: remove “replace” which is a temporary measure, implement
    // “set()” instead.

    const {indexes, prefix, redis, idPrefix = ''} = this

    return Bluebird.map(models, async function (model) {
      // Generate a new identifier if necessary.
      if (model.id === undefined) {
        model.id = idPrefix + String(await redis.incrAsync(prefix + '_id'))
      }

      const success = await redis.saddAsync(prefix + '_ids', model.id)

      // The entry already exists an we are not in replace mode.
      if (!success && !replace) {
        throw new ModelAlreadyExists(model.id)
      }

      // TODO: Remove existing fields.

      const params = []
      forEach(model, (value, name) => {
        // No need to store the identifier (already in the key).
        if (name === 'id') {
          return
        }

        params.push(name, value)
      })

      const promises = [
        redis.hmsetAsync(prefix + ':' + model.id, ...params)
      ]

      // Update indexes.
      forEach(indexes, (index) => {
        const value = model[index]
        if (value === undefined) {
          return
        }

        const key = prefix + '_' + index + ':' + value
        promises.push(redis.saddAsync(key, model.id))
      })

      await Promise.all(promises)

      return model
    })
  }

  _get (properties) {
    const {prefix, redis} = this

    if (isEmpty(properties)) {
      return redis.smembersAsync(prefix + '_ids').then(ids => this._extract(ids))
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
    const unfit = difference(getKey(properties), indexes)
    if (unfit.length) {
      throw new Error('fields not indexed: ' + unfit.join())
    }

    const keys = mapToArray(properties, (value, index) => `${prefix}_${index}:${value}`)
    return redis.sinterAsync(...keys).then(ids => this._extract(ids))
  }

  _remove (ids) {
    const {prefix, redis} = this

    // TODO: handle indexes.

    return Promise.all([
      // Remove the identifiers from the main index.
      redis.sremAsync(prefix + '_ids', ...ids),

      // Remove the models.
      redis.delAsync(mapToArray(ids, id => `${prefix}:${id}`))
    ])
  }

  _update (models) {
    return this._add(models, { replace: true })
  }
}
