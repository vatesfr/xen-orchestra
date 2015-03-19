import Bluebird from 'bluebird';
import isArray from 'lodash.isarray';
import isObject from 'lodash.isobject';
import makeError from 'make-error';
import Model from './model';
import {EventEmitter} from 'events';
import {mapInPlace} from './utils';

//====================================================================

function ModelAlreadyExists(id) {
  ModelAlreadyExists.super.call(this, 'this model already exists: ' + id);
}
makeError(ModelAlreadyExists);
export {ModelAlreadyExists};

//====================================================================

export default class Collection extends EventEmitter {
  // Default value for Model.
  get Model() {
    return Model;
  }

  // Make this property writable.
  set Model(Model) {
    Object.defineProperty(this, 'Model', {
      configurable: true,
      enumerale: true,
      value: Model,
      writable: true,
    });
  }

  constructor() {
    super();
  }

  add(models, opts) {
    let array = isArray(models);
    if (!array) {
      models = [models];

    }

    let {Model} = this;
    mapInPlace(models, model => {
      if (!(model instanceof Model)) {
        model = new Model(model);
      }

      let error = model.validate();
      if (error) {
        // TODO: Better system inspired by Backbone.js
        throw error;
      }

      return model.properties;
    });

    return Bluebird.try(this._add, [models, opts], this).then(models => {
      this.emit('add', models);

      return array ? models : new this.Model(models[0]);
    });
  }

  first(properties) {
    if (!isObject(properties)) {
      properties = (properties !== undefined) ?
        { id: properties } :
        {}
      ;
    }

    return Bluebird.try(this._first, [properties], this).then(
      model => model && new this.Model(model)
    );
  }

  get(properties) {
    if (!isObject(properties)) {
      properties = (properties !== undefined) ?
        { id: properties } :
        {}
      ;
    }

    return Bluebird.try(this._get, [properties], this);
  }

  remove(ids) {
    if (!isArray(ids)) {
      ids = [ids];
    }

    return Bluebird.try(this._remove, [ids], this).then(() => {
      this.emit('remove', ids);
      return true;
    });
  }

  update(models) {
    var array = isArray(models);
    if (!isArray(models)) {
      models = [models];
    }

    let {Model} = this;
    mapInPlace(models, model => {
      if (!(model instanceof Model)) {
        // TODO: Problems, we may be mixing in some default
        // properties which will overwrite existing ones.
        model = new Model(model);
      }

      let id = model.get('id');

      // Missing models should be added not updated.
      if (id === undefined){
        // FIXME: should not throw an exception but return a rejected promise.
        throw new Error('a model without an id cannot be updated');
      }

      var error = model.validate();
      if (error !== undefined) {
        // TODO: Better system inspired by Backbone.js.
        throw error;
      }

      return model.properties;
    });

    return Bluebird.try(this._update, [models], this).then(models => {
      this.emit('update', models);

      return array ? models : new this.Model(models[0]);
    });
  }

  // Methods to override in implementations.

  _add() {
    throw new Error('not implemented');
  }

  _get() {
    throw new Error('not implemented');
  }

  _remove() {
    throw new Error('not implemented');
  }

  _update() {
    throw new Error('not implemented');
  }

  // Methods which may be overridden in implementations.

  count(properties) {
    return this.get(properties).get('count');
  }

  exists(properties) {
    /* jshint eqnull: true */
    return this.first(properties).then(model => model != null);
  }

  _first(properties) {
    return Bluebird.try(this.get, [properties], this).then(
      models => models.length ? models[0] : null
    );
  }
}
