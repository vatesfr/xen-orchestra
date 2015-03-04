'use strict';

//====================================================================

var Bluebird = require('bluebird');
var isString = require('lodash.isstring');
var startsWith = require('lodash.startsWith');

var Api = require('./api');
var BackOff = require('./back-off');
var ConnectionError = require('./connection-error');
var createCollection = require('./collection');

//====================================================================

function makeStandaloneDeferred() {
  var resolve, reject;

  var promise = new Bluebird(function (resolve_, reject_) {
    resolve = resolve_;
    reject = reject_;
  });
  promise.resolve = resolve;
  promise.reject = reject;

  return promise;
}

function noop() {}

//====================================================================

// Try connecting to Xo-Server.
function tryConnect() {
  /* jshint validthis: true */

  this.status = 'connecting';
  return this._api.connect().bind(this).catch(function () {
    this.status = 'disconnected';

    return this._backOff.wait().bind(this).then(tryConnect);
  });
}

function resetSession() {
  /* jshint validthis: true */

  // No session has been opened and no credentials has been provided
  // yet: nothing to do.
  if (this._credentials && this._credentials.isPending()) {
    return;
  }

  // Clear any existing user.
  this.user = null;

  // Create a promise for the next credentials.
  this._credentials = makeStandaloneDeferred();

  // The promise from the previous session needs to be rejected.
  if (this._session && this._session.isPending()) {
    // Ensure Bluebird does not mark this rejection as unhandled.
    this._session.catch(noop);

    this._session.reject();
  }

  // Create a promise for the next session.
  this._session = makeStandaloneDeferred();
}

function signIn() {
  /* jshint validthis: true */

  // Capture current session.
  var session = this._session;

  this._credentials.bind(this).then(function (credentials) {
    return this._api.call(
      credentials.token ?
        'session.signInWithToken' :
        'session.signInWithPassword',
       credentials
    );
  }).then(
    function (user) {
      this.user = user;

      this._api.call('xo.getAllObjects').bind(this).then(function (objects) {
        this.objects.clear();
        this.objects.setMultiple(objects);
      }).catch(noop); // Ignore any errors.

      session.resolve();
    },
    function (error) {
      session.reject(error);
    }
  );
}

// High level interface to Xo.
//
// Handle auto-reconnect, sign in & objects cache.
function Xo(opts) {
  var self = this;

  if (!opts) {
    opts = {};
  } else if (isString(opts)) {
    opts = {
      url: opts,
    };
  }

  this._api = new Api(opts.url);
  this._backOff = new BackOff();
  this.objects = createCollection({
    indexes: [
      'ref',
      'type',
      'UUID',
    ],
    key: function (item) {
      return item.UUID || item.ref;
    },
  });
  this.status = 'disconnected';

  self._api.on('connected', function () {
    self.status = 'connected';
    self._backOff.reset();

    signIn.call(self);
  });

  self._api.on('disconnected', function () {
    self.status = 'disconnected';

    resetSession.call(self);
    tryConnect.call(self);
  });

  self._api.on('notification', function (notification) {
    if (notification.method !== 'all') {
      return;
    }

    var method = (
      notification.params.type === 'exit' ?
        'unset' :
        'set'
    ) + 'Multiple';

    self.objects[method](notification.params.items);
  });

  resetSession.call(this);

  if (opts.credentials) {
    this._credentials.resolve(opts.credentials);
  }

  tryConnect.call(this);
}

Xo.prototype.call = function (method, params) {
  // Prevent session.*() from being because it may interfere
  // with this class session management.
  if (startsWith(method, 'session.')) {
    return Bluebird.reject(
      new Error('session.*() methods are disabled from this interface')
    );
  }

  return this._session.bind(this).then(function () {
    return this._api.call(method, params).bind(this).catch(ConnectionError, function () {
      // Retry automatically.
      return this.call(method, params);
    });
  });
};

Xo.prototype.signIn = function (credentials) {
  // Ignore the returned promise as it can cause concurrency issues.
  this.signOut();

  this._credentials.resolve(credentials);

  return this._session;
};

Xo.prototype.signOut = function () {
  // Already signed in?
  var promise;
  if (!this._session.isPending()) {
    promise = this._api.call('session.signOut');
  }

  resetSession.call(this);

  signIn.call(this);

  return promise || Bluebird.resolve();
};

exports.Xo = Xo;
