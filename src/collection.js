var _ = require('underscore');
var Q = require('q');

// @todo Add events.
function Collection(items)
{
	// Parent constructor.
	Collection.super_.call(this);

	this.items = [];

	this.next_id = 0;

	if (items)
	{
		this.add(items);
	}
}
require('util').inherits(Collection, require('events').EventEmitter);

Collection.prototype.model = require('model');

/**
 * Adds new items to this collection.
 */
Collection.prototype.add = function (items) {
	var array = true;
	if (!_.isArray(items))
	{
		items = [items];
		array = false;
	}

	_.each(items, function (item, i) {
		if ( !(item instanceof this.model) )
		{
			item = new this.model(item);
			items[i] = item;
		}

		var error = item.validate();
		if (undefined !== error)
		{
			// @todo Better system inspired by Backbone.js.
			throw error;
		}

		var id = item.get('id');

		if (undefined === id)
		{
			id = this.next_id++;
			item.set('id', id);
		}

		// Existing items are ignored.
		if (this.items[id])
		{
			return Q.reject('cannot add existing items!');
		}

		this.items[id] = item;
	});

	/* jshint newcap: false */
	return Q(array ? items : items[0]);
};

/**
 *
 */
Collection.prototype.exists = function (id) {
	return (undefined !== this.items[id]);
};

/**
 *
 */
Collection.prototype.findWhere = function (properties) {
	return _.findWhere(this.items, properties);
};

/**
 * Removes items from this collection.
 */
Collection.prototype.remove = function (ids) {
	if (!_.isArray(ids))
	{
		ids = [ids];
	}

	_.each(ids, function (id) {
		delete this.items[id];
	});

	// @todo Maybe return a more meaningful value.
	/* jshint newcap: false */
	return Q(true);
};

/**
 * Updates existing items.
 */
Collection.prototype.update = function (items) {
	var array = true;
	if (!_.isArray(items))
	{
		items = [items];
		array = false;
	}

	_.each(items, function (properties, i) {
		if (properties instanceof this.model)
		{
			properties = properties.properties;
		}

		// @todo
		// var error = item.validate();
		// if (undefined !== error)
		// {
		// 	// @todo Better system inspired by Backbone.js.
		// 	throw error;
		// }

		var id = properties.id;

		var item = this.items[id];

		// Missing items are ignored.
		if (!item)
		{
			return Q.reject('missing item!');
		}

		item.set(properties);

		items[i] = item;
	});

	/* jshint newcap: false */
	return Q(array ? items : items[0]);
};

/**
 * Smartly updates the collection.
 *
 * - Adds new items.
 * - Updates existing items.
 * - Removes missing items.
 */
Collection.prototype.set = function (/*items*/) {
	throw 'not implemented';
};

Collection.extend = require('extendable');

// Export.
module.exports = Collection;
