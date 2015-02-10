'use strict';

//====================================================================

var assign = require('lodash.assign');
var Bluebird = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var jsonRpc = require('json-rpc');
var makeError = require('make-error');
var MethodNotFound = require('json-rpc/errors').MethodNotFound;
var WebSocket = require('ws');

var createCollection = require('./collection');

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
var URL_RE = /^(?:(?:http|ws)(s)?:\/\/)?(.*?)\/*(?:\/api\/)?$/;
function fixUrl(url) {
  var matches = URL_RE.exec(url);
  var isSecure = !!matches[1];
  var rest = matches[2];

  return [
    isSecure ? 'wss' : 'ws',
    '://',
    rest,
    '/api/',
  ].join('');
}
exports.fixUrl = fixUrl;

//====================================================================

var ConnectionLost = makeError('ConnectionLost');

// Low level interface to XO.
function Api(url) {
  // Super constructor.
  EventEmitter.call(this);

  // Fix the URL (ensure correct protocol and /api/ path).
  this._url = fixUrl(url);

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

assign(Api.prototype, {
  close: function () {
    if (this._socket) {
      this._socket.close();
    }
  },

  connect: Bluebird.method(function () {
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

      this_.emit('disconnected');
    });

    socket.addEventListener('error', function (error) {
      // Fails the connect promise if possible.
      deferred.reject(error);
    });

    return deferred.promise;
  }),

  call: function (method, params) {
    var jsonRpc = this._jsonRpc;

    return this.connect().then(function () {
      return jsonRpc.request(method, params);
    });
  },
});

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

// High level interface to Xo.
//
// Handle auto-reconnect, sign in & objects cache.
function Xo(opts) {
  var self = this;

  this._api = new Api(opts.url);
  this._auth = opts.auth;
  this._backOff = fibonacci(1e3);
  this.objects = createCollection(objectsOptions);
  this.user = null;

  // Promise representing the connection status.
  this._connection = null;

  this._onConnection = function () {
    self._connection = self._api.call('session.signInWithPassword', {
      email: self._auth.email,
      password: self._auth.password,
    }).then(function (user) {
      self.user = user;

      return self._api.call('xo.getAllObjects');
    }).then(function (objects) {
      self.objects.setMultiple(objects);
    });

    return self._connection;
  };

  self._api.on('disconnected', function () {
    self._connection = null;
    self.objects.clear();
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
}

assign(Xo.prototype, {
  connect: function () {
    if (this._connection) {
      return this._connection;
    }

    var self = this;
    return this._api.connect().then(this._onConnection).catch(function () {
      return Bluebird.delay(self._backOff.next().value).then(function () {
        return self.connect();
      });
    });
  },
  call: function (method, params) {
    var self = this;

    return this._connect().then(function () {
      return self._api.call(method, params).catch(ConnectionLost, function () {
        // Retry automatically.
        return self.call(method, params);
      });
    });
  },
});

exports.Xo = Xo;

//====================================================================

exports = module.exports = Xo;
