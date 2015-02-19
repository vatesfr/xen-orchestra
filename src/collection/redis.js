import Bluebird, {coroutine} from 'bluebird';
import Collection, {ModelAlreadyExists} from '../collection';
import difference from 'lodash.difference';
import filter from 'lodash.filter';
import forEach from 'lodash.foreach';
import getKey from 'lodash.keys';
import isEmpty from 'lodash.isempty';
import map from 'lodash.map';
import thenRedis from 'then-redis';

//////////////////////////////////////////////////////////////////////
// Data model:
// - prefix +'_id': value of the last generated identifier;
// - prefix +'_ids': set containing identifier of all models;
// - prefix +'_'+ index +':' + value: set of identifiers which have
//   value for the given index.
// - prefix +':'+ id: hash containing the properties of a model;
//////////////////////////////////////////////////////////////////////

// TODO: then-redis sends commands in order, we should use this
// semantic to simplify the code.

// TODO: Merge the options in the object to obtain extend-time
// configuration like Backbone.

// TODO: Remote events.

export default class Redis extends Collection {
  constructor({
    connection,
    indexes = [],
    prefix,
    uri = 'tcp://localhost:6379',
  }) {
    super();

    this.indexes = indexes;
    this.prefix = prefix;
    this.redis = connection || thenRedis.createClient(uri);
  }

  _extract(ids) {
    let prefix = this.prefix + ':';
    let {redis} = this;

    let promises = [];
    forEach(ids, id => {

    })

    let models = [];
    return Bluebird.map(ids, id => {
      return redis.hgetall(prefix + id).then(model => {
        // If empty, consider it a no match.
        if (isEmpty(model)) {
          return;
        }

        // Mix the identifier in.
        model.id = id;

        models.push(model);
      });
    }).return(models);
  }

  _add(models, {replace = false} = {}) {
    // TODO: remove “replace” which is a temporary measure, implement
    // “set()” instead.

    let {indexes, prefix, redis} = this;

    return Bluebird.map(models, coroutine(function *(model) {
      // Generate a new identifier if necessary.
      if (model.id === undefined) {
        model.id = yield redis.incr(prefix + '_id');
      }

      let success = yield redis.sadd(prefix + '_ids', model.id);

      // The entry already exists an we are not in replace mode.
      if (!success && !replace) {
        throw new ModelAlreadyExists(model.id);
      }

      // TODO: Remove existing fields.

      let params = [];
      forEach(model, (value, name) => {
        // No need to store the identifier (already in the key).
        if (name === 'id') {
          return;
        }

        params.push(name, value);
      });

      let promises = [
        redis.hmset(prefix + ':' + model.id, ...params),
      ];

      // Update indexes.
      forEach(indexes, (index) => {
        let value = model[index];
        if (value === undefined) {
          return;
        }

        let key = prefix + '_' + index + ':' + value;
        promises.push(redis.sadd(key, model.id));
      });

      yield Bluebird.all(promises);

      return model;
    }));
  }

  _get(properties) {
    let {prefix, redis} = this;

    if (isEmpty(properties)) {
      return redis.smembers(prefix + '_ids').then(ids => this._extract(ids));
    }

    // Special treatment for the identifier.
    let id = properties.id;
    if (id !== undefined) {
      delete properties.id
      return this._extract([id]).then(models => {
        return (models.length && !isEmpty(properties)) ?
          filter(models) :
          models
        ;
      });
    }

    let {indexes} = this;

    // Check for non indexed fields.
    let unfit = difference(getKey(properties), indexes);
    if (unfit.length) {
      throw new Error('fields not indexed: ' + unfit.join());
    }

    let keys = map(properties, (value, index) => prefix + '_' + index + ':' + value);
    return redis.sinter(...keys).then(ids => this._extract(ids));
  }

  _remove(ids) {
    let {prefix, redis} = this;

    // TODO: handle indexes.

    return Bluebird.all([
      // Remove the identifiers from the main index.
      redis.srem(prefix + '_ids', ...ids),

      // Remove the models.
      redis.del(map(ids, id => prefix + ':' + id)),
    ]);
  }

  _update(models) {
    return this._add(models, { replace: true });
  }
}
