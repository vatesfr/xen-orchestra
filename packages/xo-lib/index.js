'use strict';

//====================================================================

var assign = require('lodash.assign');
var Bluebird = require('bluebird');
var forEach = require('lodash.foreach');
var parseUrl = require('url').parse;
var WebSocket = require('ws');

//====================================================================

function notConnected() {
  throw new Error('not connected');
}

function startsWith(string, target) {
  return (string.lastIndexOf(target, 0) === 0);
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

//====================================================================

function Xo(url) {
  this._url = fixUrl(url);

  // Identifier of the next request.
  this._nextId = 0;

  // Promises linked to the requests.
  this._deferreds = {};

  // Current WebSocket.
  this._socket = null;

  // Current status which may be:
  // - disconnected
  // - connecting
  // - connected
  this.status = 'disconnected';
}

assign(Xo.prototype, {
  close: function () {
    if (this._socket) {
      this._socket.close();
    }
  },

  connect: function () {
    if (this.status === 'connected') {
      return Bluebird.cast();
    }

    var deferred = Bluebird.defer();

    this.status = 'connecting';

    var opts = {};
    if (startsWith(this._url, 'wss')) {
      // Due to imperfect TLS implementation in XO-Server.
      opts.rejectUnauthorized = false;
    }
    var socket = this._socket = new WebSocket(this._url, '', opts);

    // When the socket opens, send any queued requests.
    socket.addEventListener('open', function () {
      this.status = 'connected';

      // (Re)Opens accesses.
      delete this.send;

      // Resolves the promise.
      deferred.resolve();
    }.bind(this));

    socket.addEventListener('message', function (data) {
      // `ws` API is lightly different from standard API.
      if (data.data) {
        data = data.data;
      }

      // TODO: Wraps in a promise to prevent releasing the Zalgo.
      var response = JSON.parse(data);

      var id = response.id;

      var deferred = this._deferreds[id];
      if (!deferred) {
        // Response already handled.
        return;
      }
      delete this._deferreds[id];

      if ('error' in response) {
        return deferred.reject(response.error);
      }

      if ('result' in response) {
        return deferred.resolve(response.result);
      }

      deferred.reject({
        message: 'invalid response received',
        object: response,
      });
    }.bind(this));

    socket.addEventListener('close', function () {
      // Closes accesses.
      this.send = notConnected;

      // Fails all waiting requests.
      forEach(this._deferreds, function (deferred) {
        deferred.reject('not connected');
      });
      this._deferreds = {};
    }.bind(this));

    socket.on('error', function (error) {
      // Fails the connect promise if possible.
      deferred.reject(error);
    });

    return deferred.promise;
  },

  call: function (method, params) {
    return this.connect().then(function () {
      var socket = this._socket;

      var id = this._nextId++;

      socket.send(JSON.stringify({
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params || [],
      }));

      var deferred = this._deferreds[id] = Bluebird.defer();

      return deferred.promise;
    }.bind(this));
  },
});

//====================================================================

exports = module.exports = Xo;
exports.fixUrl = fixUrl;
