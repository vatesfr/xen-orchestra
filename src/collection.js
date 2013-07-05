// @todo Add events.

var Collection = function (items) {
	this.items = [];

	this.next_id = 0;

	if (items)
	{
		this.add(items);
	}
};
util.inherits(Collection, EventEmitter);

Collection.prototype.model = require('model');

/**
 * Adds new items to this collection.
 */
Collection.prototype.add = function (items) {
	if (!_.isArray(items))
	{
		items = [items];
	}

	_.each(items, function (item) {
		if ( !(item instanceof this.model) )
		{
			item = new this.model(item);
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
		if (!this.items[id])
		{
			this.items[id] = item;
		}
	});
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
};

/**
 * Updates existing items.
 */
Collection.prototype.update = function (items) {
	if (!_.isArray(items))
	{
		items = [items];
	}

	_.each(items, function (item) {
		if (item instanceof this.model)
		{
			item = item.properties;
		}

		// @todo
		// var error = item.validate();
		// if (undefined !== error)
		// {
		// 	// @todo Better system inspired by Backbone.js.
		// 	throw error;
		// }

		var id = item.id;

		// Missing items are ignored.
		if (this.items[id])
		{
			this.items[id].set(item);
		}
	});
};

/**
 * Smartly updates the collection.
 *
 * - Adds new items.
 * - Updates existing items.
 * - Removes missing items.
 */
Collection.prototype.set = function (items) {
	throw 'not implemented';
};

Model.extend = require('extendable');

// Export.
module.exports = Model;
