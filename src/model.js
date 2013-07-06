var _ = require('underscore');

function Model(properties)
{
	// Parent constructor.
	Model.super_.call(this);

	this.properties = {};

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
 * Validates the model.
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

	prop = this['default'][property];
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
	return (undefined !== this.get(property));
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

	_.extend(this.properties, properties);
};

/**
 * Unsets properties.
 */
Model.prototype.unset = function (properties) {
	this.properties = _.omit(this.properties, properties);
};

/**
 * Default properties.
 *
 * @type {Object}
 */
Model.prototype['default'] = {};

Model.extend = require('extendable');

// Export.
module.exports = Model;
