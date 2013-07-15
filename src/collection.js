var _ = require('underscore');
var Q = require('q');

//////////////////////////////////////////////////////////////////////

// @todo Maybe we should generalize the getter methods (get,
// findWhere, where) to two methods: get([properties]) &
// first([properties]).
//
// Each of these methods accept optionnal properties to filter its
// results.
//
// get() returns any models that match while first() returns only the
// one.
//
// These method should also accept a scalar value as a matching value
// for the “id” property.

// @todo Add events.
function Collection(models)
{
	// Parent constructor.
	Collection.super_.call(this);

	this.models = {};

	this.next_id = 0;

	if (models)
	{
		this.add(models);
	}
}
require('util').inherits(Collection, require('events').EventEmitter);

Collection.prototype.model = require('./model');

/**
 * Adds new models to this collection.
 */
Collection.prototype.add = function (models) {
	var array = true;
	if (!_.isArray(models))
	{
		models = [models];
		array = false;
	}

	for (var i = 0, n = models.length; i < n; ++i)
	{
		var model = models[i];

		if ( !(model instanceof this.model) )
		{
			model = new this.model(model);
			models[i] = model;
		}

		var error = model.validate();
		if (undefined !== error)
		{
			// @todo Better system inspired by Backbone.js.
			throw error;
		}

		var id = model.get('id');

		if (undefined === id)
		{
			id = this.next_id++;
			model.set('id', id);
		}

		// Existing models are ignored.
		if (this.models[id])
		{
			return Q.reject('cannot add existing models!');
		}

		this.models[id] = model.properties;
	}

	/* jshint newcap: false */
	return Q(array ? models : models[0]);
};

Collection.prototype.get = function (id) {
	/* jshint newcap:false */

	var model = this.models[id];

	if (!model)
	{
		return Q(null);
	}

	return Q(new this.model(model));
};

/**
 *
 */
Collection.prototype.exists = function (id) {
	return (undefined !== this.models[id]);
};

/**
 * Find the first model which has a given set of properties.
 */
Collection.prototype.findWhere = function (properties) {
	/* jshint newcap: false */

	var model = _.findWhere(this.models, properties);

	return Q(model ? new this.model(model) : null);
};


/**
 * Find all models which have a given set of properties.
 *
 * /!\: Does not return instance of this.model.
 */
Collection.prototype.where = function (properties) {
	/* jshint newcap: false */
	if (_.isEmpty(properties))
	{
		return Q(_.extend({}, this.models));
	}

	return Q(_.where(this.models, properties));
};


/**
 * Removes models from this collection.
 */
Collection.prototype.remove = function (ids) {
	if (!_.isArray(ids))
	{
		ids = [ids];
	}

	_.each(ids, function (id) {
		delete this.models[id];
	}, this);

	this.emit('remove', ids);

	// @todo Maybe return a more meaningful value.
	/* jshint newcap: false */
	return Q(true); // @todo Returns false if it fails.
};

/**
 * Updates existing models.
 */
Collection.prototype.update = function (models) {
	var array = true;
	if (!_.isArray(models))
	{
		models = [models];
		array = false;
	}

	// @todo Rewrite.
	for (var i = 0; i < models.length; i++)
	{
		var model = models[i];

		if (model instanceof this.model)
		{
			model = model.properties;
		}

		var id = model.id;

		// Missing models should be added not updated.
		if (!this.models[id])
		{
			return Q.reject('missing model');
		}

		// @todo Model validation.

		// @todo Event handling.
		_.extend(this.models[id], model);
	}

	/* jshint newcap: false */
	return Q(array ? models : models[0]);
};

/**
 * Smartly updates the collection.
 *
 * - Adds new models.
 * - Updates existing models.
 * - Removes missing models.
 */
Collection.prototype.set = function (/*models*/) {
	throw 'not implemented';
};

Collection.extend = require('extendable');

//////////////////////////////////////////////////////////////////////

module.exports = Collection;
