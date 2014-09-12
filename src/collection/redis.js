'use strict';

//====================================================================

var contains = require('lodash.contains');
var defaults = require('lodash.defaults');
var difference = require('lodash.difference');
var filter = require('lodash.filter');
var forEach = require('lodash.foreach');
var getKeys = require('lodash.keys');
var isEmpty = require('lodash.isempty');
var isEmpty = require('lodash.isempty');
var map = require('lodash.map');
var Promise = require('bluebird');
var thenRedis = require('then-redis');

//====================================================================

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

function Redis(options, models)
{
	if (!options)
	{
		options = {};
	}

	defaults(options, {
		'uri': 'tcp://localhost:6379',
		'indexes': [],
	});

	if (!options.prefix)
	{
		throw 'missing option: prefix';
	}

	Redis.super_.call(this, models);

	this.redis = options.connection || thenRedis.createClient(options.uri);
	this.prefix = options.prefix;
	this.indexes = options.indexes;
}
require('util').inherits(Redis, require('../collection'));

// Private method.
Redis.prototype._extract = function (ids) {
	var redis = this.redis;
	var prefix = this.prefix +':';

	var promises = [];

	forEach(ids, function (id) {
		promises.push(redis.hgetall(prefix + id).then(function (model) {
			// If empty, considers it a no match and returns null.
			if (isEmpty(model))
			{
				return null;
			}

			// Mix the identifier in.
			model.id = id;
			return model;
		}));
	});

	return Promise.all(promises).then(function (models) {
		return filter(models, function (model) {
			return (null !== model);
		});
	});
};

Redis.prototype._add = function (models, options) {
	// TODO: Temporary mesure, implement “set()” instead.
	var replace = !!(options && options.replace);

	var redis = this.redis;
	var prefix = this.prefix;
	var indexes = this.indexes;

	var promises = [];

	forEach(models, function (model) {
		var promise;

		// Generates a new identifier if necessary.
		if (undefined === model.id)
		{
			promise = redis.incr(prefix +'_id').then(function (id) {
				model.id = id;
			});
		}
		else
		{
			// Ensures the promise chain is correctly initialized.
			promise = Promise.cast();
		}

		promise = promise.then(function () {
			// Adds the identifier to the models' ids set.
			return redis.sadd(prefix +'_ids', model.id);
		}).then(function (success) {
			// The entry already existed an we are not in replace mode.
			if (!success && !replace)
			{
				throw 'cannot add existing model: '+ model.id;
			}

			// TODO: Remove existing fields.

			var params = [prefix +':'+ model.id];
			forEach(model, function (value, prop) {
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
			forEach(indexes, function (index) {
				var value = model[index];
				if (undefined === value)
				{
					return;
				}

				var key = prefix +'_'+ index +':'+ value;
				promises.push(redis.sadd(key, model.id));
			});

			return Promise.all(promises);

		}).then(function () { return model; });

		promises.push(promise);
	});

	return Promise.all(promises);
};

Redis.prototype._get = function (properties) {
	var prefix = this.prefix;
	var redis = this.redis;
	var self = this;

	if (isEmpty(properties))
	{
		return redis.smembers(prefix +'_ids').then(function (ids) {
			return self._extract(ids);
		});
	}

	// Special treatment for 'id'.
	var id = properties.id;
	delete properties.id;

	// Special case where we only match against id.
	if (isEmpty(properties))
	{
		return this._extract([id]);
	}

	var indexes = this.indexes;
	var unfit = difference(getKeys(properties), indexes);
	if (0 !== unfit.length)
	{
		throw 'not indexed fields: '+ unfit.join();
	}

	var keys = map(properties, function (value, index) {
		return (prefix +'_'+ index +':'+ value);
	});
	return redis.send('sinter', keys).then(function (ids) {
		if (undefined !== id)
		{
			if (!contains(ids, id))
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

	// TODO: Handle indexes.
	promises.push(
		redis.send('srem', [prefix +'_ids'].concat(ids)),
		redis.send('del', keys)
	);

	return Promise.all(promises);
};

Redis.prototype._update = function (models) {
	// TODO:
	return this._add(models, { 'replace': true });
};

//////////////////////////////////////////////////////////////////////

Redis.extend = require('extendable');
module.exports = Redis;
