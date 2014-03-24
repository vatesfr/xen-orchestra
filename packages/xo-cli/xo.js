'use strict';

//====================================================================

var _ = require('lodash');

var Promise = require('bluebird');

// Supports browsers.
// FIXME: wraps in an anonymous function.
var WebSocket = 'WebSocket' in window ? window.WebSocket : require('ws');

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

      // Reopens accesses.
      delete this.send;
    }.bind(this));

    socket.on('message', function (event) {
      // TODO: Wraps in a promise to prevent releasing the Zalgo.
      var response = JSON.parse(event.data);

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
    });

    socket.on('close', function () {
      // Closes accesses.
      this.send = function () {
        throw new Error('not connected');
      };

      // Fails all waiting requests.
      _.each(this._deferreds, function (deferred) {
        deferred.reject('not connected');
      });
      this._deferreds = {};
    }.bind(this));

    return deferred.promise;
  },

  send: function (method, params) {
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
    });
  },
});

//====================================================================

module.exports = Xo;
