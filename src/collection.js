var _ = require('underscore');
var Q = require('q');

//////////////////////////////////////////////////////////////////////

// @todo Add events.
function Collection(models)
{
	// Parent constructor.
	Collection.super_.call(this);

	this.models = [];

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

	_.each(models, function (model, i) {
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
	}, this);

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
 *
 */
Collection.prototype.findWhere = function (properties) {
	/* jshint newcap: false */

	var model = _.findWhere(this.models, properties);

	return Q(model ? new this.model(model) : null);
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
	_.each(models, function (properties, i) {
		if (properties instanceof this.model)
		{
			properties = properties.properties;
		}

		// @todo
		// var error = model.validate();
		// if (undefined !== error)
		// {
		// 	// @todo Better system inspired by Backbone.js.
		// 	throw error;
		// }

		var id = properties.id;

		var model = this.models[id];

		// Missing models are ignored.
		if (!model)
		{
			return Q.reject('missing model!');
		}

		_.extend(model.properties, model);

		models[i] = model;
	});

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
