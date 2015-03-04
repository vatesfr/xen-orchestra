'use strict';

//====================================================================

var Bluebird = require('bluebird');
Bluebird.longStackTraces();
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var isString = require('lodash.isstring');
var jsonRpc = require('json-rpc');
var makeError = require('make-error');
var MethodNotFound = require('json-rpc/errors').MethodNotFound;
var WebSocket = require('ws');

var createCollection = require('./collection');

//====================================================================

// Expose Bluebird for now to ease integration (e.g. with Angular.js).
exports.setScheduler = Bluebird.setScheduler;

//====================================================================

function makeDeferred() {
  var resolve, reject;
  var promise = new Bluebird(function (resolve_, reject_) {
    resolve = resolve_;
    reject = reject_;
  });

  return {
    promise: promise,
    reject: reject,
    resolve: resolve,
  };
}

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

function startsWith(string, target) {
  return (string.lastIndexOf(target, 0) === 0);
}

//====================================================================

function returnThis() {
  /* jshint validthis: true */

  return this;
}

// Returns an iterator to the Fibonacci sequence.
function fibonacci(start) {
  var prev = 0;
  var curr = start || 1;

  var iterator = {
    next: function () {
      var tmp = curr;
      curr += prev;
      prev = tmp;

      return {
        done: false,
        value: prev,
      };
    },
  };

  // Make the iterator a true iterable (ES6).
  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = returnThis;
  }

  return iterator;
}

//====================================================================

// Fix URL if necessary.
var URL_RE = /^(?:(?:http|ws)(s)?:\/\/)?(.*?)\/*(?:\/api\/)?(\?.*?)?(?:#.*)?$/;
function fixUrl(url) {
  var matches = URL_RE.exec(url);
  var isSecure = !!matches[1];
  var hostAndPath = matches[2];
  var search = matches[3];

  return [
    isSecure ? 'wss' : 'ws',
    '://',
    hostAndPath,
    '/api/',
    search,
  ].join('');
}
exports.fixUrl = fixUrl;

//====================================================================

function getCurrentUrl() {
  /* global window: false */

  if (typeof window === undefined) {
    throw new Error('cannot get current URL');
  }

  return String(window.location);
}

//====================================================================

var ConnectionLost = makeError('ConnectionLost');

// Low level interface to XO.
function Api(url) {
  // Super constructor.
  EventEmitter.call(this);

  // Fix the URL (ensure correct protocol and /api/ path).
  this._url = fixUrl(url || getCurrentUrl());

  // Will contains the WebSocket.
  this._socket = null;

  // The JSON-RPC server.
  var this_ = this;
  this._jsonRpc = jsonRpc.createServer(function (message) {
    if (message.type === 'notification') {
      this_.emit('notification', message);
    } else {
      // This object does not support requests.
      throw new MethodNotFound(message.method);
    }
  }).on('data', function (message) {
    this_._socket.send(JSON.stringify(message));
  });
}
inherits(Api, EventEmitter);

Api.prototype.close = function () {
  if (this._socket) {
    this._socket.close();
  }
};

Api.prototype.connect = Bluebird.method(function () {
  if (this._socket) {
    return;
  }

  var deferred = makeDeferred();

  var opts = {};
  if (startsWith(this._url, 'wss')) {
    // Due to imperfect TLS implementation in XO-Server.
    opts.rejectUnauthorized = false;
  }
  var socket = this._socket = new WebSocket(this._url, '', opts);

  // Used to avoid binding listeners to this object.
  var this_ = this;

  // When the socket opens, send any queued requests.
  socket.addEventListener('open', function () {
    // Resolves the promise.
    deferred.resolve();

    this_.emit('connected');
  });

  socket.addEventListener('message', function (message) {
    this_._jsonRpc.write(message.data);
  });

  socket.addEventListener('close', function () {
    this_._socket = null;

    this_._jsonRpc.failPendingRequests(new ConnectionLost());

    // Only emit this event if connected before.
    if (deferred.promise.isFulfilled()) {
      this_.emit('disconnected');
    }
  });

  socket.addEventListener('error', function (error) {
    // Fails the connect promise if possible.
    deferred.reject(error);
  });

  return deferred.promise;
});

Api.prototype.call = function (method, params) {
  var jsonRpc = this._jsonRpc;

  return this.connect().then(function () {
    return jsonRpc.request(method, params);
  });
};

exports.Api = Api;

//====================================================================

var objectsOptions = {
  indexes: [
    'ref',
    'type',
    'UUID',
  ],
  key: function (item) {
    return item.UUID || item.ref;
  },
};

// Try connecting to Xo-Server.
function tryConnect() {
  /* jshint validthis: true */

  this.status = 'connecting';
  return this._api.connect().bind(this).catch(function () {
    this.status = 'disconnected';
    var delay = this._backOff.next().value;
    return Bluebird.delay(delay).bind(this).then(tryConnect);
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
  this._backOff = fibonacci(1e3);
  this.objects = createCollection(objectsOptions);
  this.status = 'disconnected';

  self._api.on('connected', function () {
    self.status = 'connected';

    // Reset back off.
    self._backOff = fibonacci(1e3);

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
    return this._api.call(method, params).bind(this).catch(ConnectionLost, function () {
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
