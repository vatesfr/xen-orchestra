'use strict';

//====================================================================

var _ = require('lodash');

var Promise = require('bluebird');

// Supports browsers.
// FIXME: wraps in an anonymous function.
// jshint ignore: start
var WebSocket = (this && 'WebSocket' in this) ? this.WebSocket : require('ws');
// jshint ignore: end

//====================================================================

var notConnected = function () {
  throw new Error('not connected');
};

//====================================================================

var Xo = function (url) {
  this._url = url;

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
};

_.extend(Xo.prototype, {
  close: function () {
    if (this._socket)
    {
      this._socket.close();
    }
  },

  connect: function () {
    if (this.status === 'connected')
    {
      return Promise.cast();
    }

    var deferred = Promise.defer();

    this.status = 'connecting';

    var socket = this._socket = new WebSocket(this._url);

    // When the socket opens, send any queued requests.
    socket.on('open', function () {
      this.status = 'connected';

      // (Re)Opens accesses.
      delete this.send;

      // Resolves the promise.
      deferred.resolve();
    }.bind(this));

    socket.on('message', function (data) {
      // `ws` API is lightly different from standard API.
      if (data.data)
      {
        data = data.data;
      }

      // TODO: Wraps in a promise to prevent releasing the Zalgo.
      var response = JSON.parse(data);

      var id = response.id;

      var deferred = this._deferreds[id];
      if (!deferred)
      {
        // Response already handled.
        return;
      }
      delete this._deferreds[id];

      if ('error' in response)
      {
        return deferred.reject(response.error);
      }

      if ('result' in response)
      {
        return deferred.resolve(response.result);
      }

      deferred.reject({
        message: 'invalid response received',
        object: response,
      });
    }.bind(this));

    socket.on('close', function () {
      // Closes accesses.
      this.send = notConnected;

      // Fails all waiting requests.
      _.each(this._deferreds, function (deferred) {
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

      var deferred = this._deferreds[id] = Promise.defer();

      return deferred.promise;
    }.bind(this));
  },
});

//====================================================================

module.exports = Xo;
