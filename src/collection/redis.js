var _ = require('underscore');
var Q = require('q');

var then_redis;
function create_redis_client(uri)
{
	if (!then_redis)
	{
		then_redis = require('then-redis');
	}

	return then_redis.createClient(uri);
}

//////////////////////////////////////////////////////////////////////
// Data model:
// - prefix +'_id': value of the last generated identifier;
// - prefix +'_ids': set containing identifier of all models;
// - prefix +'_'+ index +':' + value: set of identifiers which have
//   value for the given index.
// - prefix +':'+ id: hash containing the properties of a model;
//////////////////////////////////////////////////////////////////////

// @todo then-redis sends commands in order, we should use this
// semantic to simplify the code.

// @todo Merge the options in the object to obtain extend-time
// configuration like Backbone.

// @todo Remote events.

function Redis(options, models)
{
	if (!options)
	{
		options = {};
	}

	_.defaults(options, {
		'uri': 'tcp://localhost:6379',
		'indexes': [],
	});

	if (!options.prefix)
	{
		throw 'missing option: prefix';
	}

	Redis.super_.call(this, models);

	this.redis = options.connection || create_redis_client(options.uri);
	this.prefix = options.prefix;
	this.indexes = options.indexes;
}
require('util').inherits(Redis, require('../collection'));

// Private method.
Redis.prototype._extract = function (ids) {
	var redis = this.redis;
	var prefix = this.prefix +':';

	var promises = [];

	_.each(ids, function (id) {
		promises.push(redis.hgetall(prefix + id).then(function (model) {
			// If empty, considers it a no match and returns null.
			if (_.isEmpty(model))
			{
				return null;
			}

			// Mix the identifier in.
			model.id = id;
			return model;
		}));
	});

	return Q.all(promises).then(function (models) {
		return _.filter(models, function (model) {
			return (null !== model);
		});
	});
};

Redis.prototype._add = function (models, options) {
	// @todo Temporary mesure, implement “set()” instead.
	var replace = !!(options && options.replace);

	var redis = this.redis;
	var prefix = this.prefix;
	var indexes = this.indexes;

	var promises = [];

	_.each(models, function (model) {
		var promise;

		// Generates a new identifier if necessary.
		if (undefined === model.id)
		{
			promise = redis.incr(prefix +'_id').then(function (id) {
				model.id = id;
			});
		}

		promise = Q.when(promise, function () {
			// Adds the identifier to the models' ids set.
			return redis.sadd(prefix +'_ids', model.id);
		}).then(function (success) {
			// The entry already existed an we are not in replace mode.
			if (!success && !replace)
			{
				throw 'cannot add existing model: '+ model.id;
			}

			// @todo Remove existing fields.

			var params = [prefix +':'+ model.id];
			_.each(model, function (value, prop) {
				// No need to store the id (already in the key.)
				if ('id' === prop)
				{
					return;
				}

				params.push(prop, value);
			});

			var promises = [
				redis.send('hmset', params),
			];

			// Adds indexes.
			_.each(indexes, function (index) {
				var value = model[index];
				if (undefined === value)
				{
					return;
				}

				var key = prefix +'_'+ index +':'+ value;
				promises.push(redis.sadd(key, model.id));
			});

			return Q.all(promises);

		}).thenResolve(model);

		promises.push(promise);
	});

	return Q.all(promises);
};

Redis.prototype._get = function (properties) {
	var prefix = this.prefix;
	var redis = this.redis;
	var self = this;

	if (_.isEmpty(properties))
	{
		return redis.smembers(prefix +'_ids').then(function (ids) {
			return self._extract(ids);
		});
	}

	// Special treatment for 'id'.
	var id = properties.id;
	delete properties.id;

	// Special case where we only match against id.
	if (_.isEmpty(properties))
	{
		return this._extract([id]);
	}

	var indexes = this.indexes;
	var unfit = _.difference(_.keys(properties), indexes);
	if (0 !== unfit.length)
	{
		throw 'not indexed fields: '+ unfit.join();
	}

	var keys = _.map(properties, function (value, index) {
		return (prefix +'_'+ index +':'+ value);
	});
	return redis.send('sinter', keys).then(function (ids) {
		if (undefined !== id)
		{
			if (!_.contains(ids, id))
			{
				return [];
			}

			ids = [id];
		}

		return self._extract(ids);
	});
};

Redis.prototype._remove = function (ids) {
	var redis = this.redis;
	var prefix = this.prefix;

	var promises = [];

	var keys = [];
	for (var i = 0, n = ids.length; i < n; ++i)
	{
		keys.push(prefix +':'+ ids[i]);
	}

	// @todo Handle indexes.
	promises.push(
		redis.send('srem', [prefix +'_ids'].concat(ids)),
		redis.send('del', keys)
	);

	return Q.all(promises);
};

Redis.prototype._update = function (models) {
	// @todo
	return this._add(models, { 'replace': true });
};

//////////////////////////////////////////////////////////////////////

Redis.extend = require('extendable');
module.exports = Redis;
