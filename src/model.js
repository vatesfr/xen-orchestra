var _ = require('underscore');

//////////////////////////////////////////////////////////////////////

function Model(properties)
{
	// Parent constructor.
	Model.super_.call(this);

	this.properties = _.extend({}, this['default']);

	if (properties)
	{
		this.set(properties);
	}
}
require('util').inherits(Model, require('events').EventEmitter);

/**
 * Initializes the model after construction.
 */
Model.prototype.initialize = function () {};

/**
 * Validates the defined properties.
 *
 * @returns {undefined|mixed} Returns something else than undefined if
 *     there was an error.
 */
Model.prototype.validate = function (/*properties*/) {};

/**
 * Gets property.
 */
Model.prototype.get = function (property, def) {
	var prop = this.properties[property];
	if (undefined !== prop)
	{
		return prop;
	}

	return def;
};

/**
 * Checks if a property exists.
 */
Model.prototype.has = function (property) {
	return (undefined !== this.properties[property]);
};

/**
 * Sets properties.
 */
Model.prototype.set = function (properties, value) {
	if (undefined !== value)
	{
		var property = properties;
		properties = {};
		properties[property] = value;
	}

	var previous = {};

	var model = this;
	_.each(properties, function (value, key) {
		if (undefined === value)
		{
			return;
		}

		var prev = model.get(key);

		// New value.
		if (value !== prev)
		{
			previous[key] = prev;
			model.properties[key] = value;
		}
	});

	if (!_.isEmpty(previous))
	{
		this.emit('change', previous);

		_.each(previous, function (previous, property) {
			this.emit('change:'+ property, previous);
		}, this);
	}
};

/**
 * Unsets properties.
 */
Model.prototype.unset = function (properties) {
	// @todo Events.
	this.properties = _.omit(this.properties, properties);
};

/**
 * Default properties.
 *
 * @type {Object}
 */
Model.prototype['default'] = {};

Model.extend = require('extendable');

//////////////////////////////////////////////////////////////////////

module.exports = Model;
