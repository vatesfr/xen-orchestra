'use strict';

//====================================================================

var forEach = require('lodash.foreach');
var indexOf = require('lodash.indexof');

//====================================================================

function defaultKey(item) {
  return item.id || item._id || item;
}

//====================================================================

function Collection(opts) {
  if (!opts) {
    opts = {};
  }

  this._key = opts.key || defaultKey;

  this._indexes = Object.create(null);
  if (opts.indexes) {
    forEach(opts.indexes, function (field) {
      this[field] = Object.create(null);
    }, this._indexes);
  }

  this._data = Object.create(null);
}

function createIndex(_, field) {
  /* jshint validthis: true */
  this[field] = Object.create(null);
}

Collection.prototype.clear = function () {
  this._data = Object.create(null);
  forEach(this._indexes, createIndex, this._indexes);
};

Collection.prototype.get = function (key) {
  return this._data[key];
};

// Find the first entry in an index for a given value.
Collection.prototype.find = function (field, value) {
  return this.where(field, value)[0];
};

// Find all entries in an index for a given value.
Collection.prototype.where = function (field, value) {
  var index = this._indexes[field];

  if (!index) {
    throw new Error('no such index');
  }

  return index[value] || [];
};

function unsetItemFromIndex(index, field) {
  /* jshint validthis: true */

  var prop = this[field];
  if (!prop) {
    return;
  }

  var items = index[prop];

  var i = indexOf(items, this);
  if (i === -1) {
    return;
  }

  // The index contains only this one item for this prop.
  if (items.length === 1) {
    delete index[prop];
    return;
  }

  // Remove this item.
  items.splice(i, 1);
}

// Internal unset method.
function unset(item, key) {
  /* jshint validthis: true */

  delete this._data[key];

  forEach(this._indexes, unsetItemFromIndex, item);
}

function setItemToIndex(index, field) {
  /* jshint validthis: true */

  var prop = this[field];
  if (!prop) {
    return;
  }

  var items = index[prop];
  if (items) {
    // Update the items list.
    items.push(this);
  } else {
    // Create the items list.
    index[prop] = [this];
  }
}

Collection.prototype.set = function (item) {
  var key = this._key(item);
  if (!key) {
    // Ignore empty keys.
    return;
  }

  var previous = this._data[key];
  if (previous) {
    unset.call(this, previous, key);
  }

  this._data[key] = item;
  forEach(this._indexes, setItemToIndex, item);
};

Collection.prototype.unset = function (item) {
  unset.call(this, item, this._key(item));
};

Collection.prototype.setMultiple = function (items) {
  forEach(items, this.set, this);
};
Collection.prototype.unsetMultiple = function (items) {
  forEach(items, this.unset, this);
};

//====================================================================

function createCollection(opts) {
  return new Collection(opts);
}
module.exports = createCollection;
