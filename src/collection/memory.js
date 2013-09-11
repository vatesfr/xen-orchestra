var _ = require('underscore');
var Q = require('q');

//////////////////////////////////////////////////////////////////////

function Memory(models)
{
	Memory.super_.call(this);

	this.models = {};
	this.next_id = 0;

	if (models)
	{
		this.add(models);
	}
}
require('util').inherits(Memory, require('../collection'));

Memory.prototype._add = function (models, options) {
	// @todo Temporary mesure, implement “set()” instead.
	var replace = !!(options && options.replace);

	for (var i = 0, n = models.length; i < n; ++i)
	{
		var model = models[i];

		var id = model.id;

		if (undefined === id)
		{
			model.id = id = ''+ this.next_id++;
		}
		else if (!replace && this.models[id])
		{
			// Existing models are ignored.
			return Q.reject('cannot add existing models!');
		}

		this.models[id] = model;
	}

	return models;
};

Memory.prototype._first = function (properties) {
	if (_.isEmpty(properties))
	{
		// Return the first model if any.
		for (var id in this.models)
		{
			return this.models[id];
		}

		return null;
	}

	return _.findWhere(this.models, properties);
};

Memory.prototype._get = function (properties) {
	if (_.isEmpty(properties))
	{
		return _.values(this.models);
	}

	return _.where(this.models, properties);
};

Memory.prototype._remove = function (ids) {
	for (var i = 0, n = ids.length; i < n; ++i)
	{
		delete this.models[ids[i]];
	}
};

Memory.prototype._update = function (models) {
	for (var i = 0, n = models.length; i < n; i++)
	{
		var model = models[i];

		var id = model.id;

		// Missing models should be added not updated.
		if (!this.models[id])
		{
			return Q.reject('missing model');
		}

		_.extend(this.models[id], model);
	}
	return models;
};

//////////////////////////////////////////////////////////////////////

Memory.extend = require('extendable');
module.exports = Memory;

