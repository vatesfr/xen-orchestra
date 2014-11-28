'use strict';

//====================================================================

var assign = require('lodash.assign');
var find = require('lodash.find');
var isEmpty = require('lodash.isempty');
var Promise = require('bluebird');
var values = require('lodash.values');
var where = require('lodash.where');

//====================================================================

function Memory(models)
{
	Memory.super_.call(this);

	this._models = {};
	this._nextId = 0;

	if (models)
	{
		this.add(models);
	}
}
require('util').inherits(Memory, require('../collection'));

Memory.prototype._add = function (models, options) {
	// TODO: Temporary mesure, implement “set()” instead.
	var replace = !!(options && options.replace);

	for (var i = 0, n = models.length; i < n; ++i)
	{
		var model = models[i];

		var id = model.id;

		if (undefined === id)
		{
			model.id = id = ''+ this._nextId++;
		}
		else if (!replace && this._models[id])
		{
			// Existing models are ignored.
			return Promise.reject('cannot add existing models!');
		}

		this._models[id] = model;
	}

	return models;
};

Memory.prototype._first = function (properties) {
	if (isEmpty(properties))
	{
		// Return the first model if any.
		for (var id in this._models)
		{
			return this._models[id];
		}

		return null;
	}

	return find(this._models, properties);
};

Memory.prototype._get = function (properties) {
	if (isEmpty(properties))
	{
		return values(this._models);
	}

	return where(this._models, properties);
};

Memory.prototype._remove = function (ids) {
	for (var i = 0, n = ids.length; i < n; ++i)
	{
		delete this._models[ids[i]];
	}
};

Memory.prototype._update = function (models) {
	for (var i = 0, n = models.length; i < n; i++)
	{
		var model = models[i];

		var id = model.id;

		// Missing models should be added not updated.
		if (!this._models[id])
		{
			return Promise.reject('missing model');
		}

		assign(this._models[id], model);
	}
	return models;
};

//////////////////////////////////////////////////////////////////////

Memory.extend = require('extendable');
module.exports = Memory;

