'use strict'

// ===================================================================

var Bluebird = require('bluebird')
var EventEmitter = require('events').EventEmitter
var eventToPromise = require('event-to-promise')
var inherits = require('util').inherits
var jsonRpc = require('@julien-f/json-rpc')
var MethodNotFound = require('@julien-f/json-rpc/errors').MethodNotFound
var startsWith = require('lodash.startswith')
var WebSocket = require('ws')

var ConnectionError = require('./connection-error')
var fixUrl = require('./fix-url')

// ===================================================================

function getCurrentUrl () {
  /* global window: false */

  if (typeof window === 'undefined') {
    throw new Error('cannot get current URL')
  }

  return String(window.location)
}

function makeDeferred () {
  var resolve, reject
  var promise = new Bluebird(function (resolve_, reject_) {
    resolve = resolve_
    reject = reject_
  })

  return {
    promise: promise,
    reject: reject,
    resolve: resolve
  }
}

function noop () {}

// -------------------------------------------------------------------

// Low level interface to XO.
function Api (url) {
  // Super constructor.
  EventEmitter.call(this)

  // Fix the URL (ensure correct protocol and /api/ path).
  this._url = fixUrl(url || getCurrentUrl())

  // Will contains the connection promise.
  this._connection = null

  // Will contains the WebSocket.
  this._socket = null

  // The JSON-RPC server.
  var this_ = this
  this._jsonRpc = jsonRpc.createServer(function (message) {
    if (message.type === 'notification') {
      this_.emit('notification', message)
    } else {
      // This object does not support requests.
      throw new MethodNotFound(message.method)
    }
  }).on('data', function (message) {
    this_._socket.send(JSON.stringify(message))
  })
}
inherits(Api, EventEmitter)

Api.prototype.close = function () {
  var socket = this._socket
  if (socket) {
    socket.close()

    console.log(socket.readyState)
    if (socket.readyState !== 3) {
      return eventToPromise(socket, 'close').then(noop)
    }
  }

  return Bluebird.resolve()
}

Api.prototype.connect = function () {
  if (this._connection) {
    return this._connection
  }

  var deferred = makeDeferred()
  this._connection = deferred.promise

  var opts = {}
  if (startsWith(this._url, 'wss')) {
    // Due to imperfect TLS implementation in XO-Server.
    opts.rejectUnauthorized = false
  }
  var socket = this._socket = new WebSocket(this._url, '', opts)

  // Used to avoid binding listeners to this object.
  var this_ = this

  // When the socket opens, send any queued requests.
  socket.addEventListener('open', function () {
    // Resolves the promise.
    deferred.resolve()

    this_.emit('connected')
  })

  socket.addEventListener('error', function (error) {
    this_._connection = null
    this_._socket = null

    // Fails the connect promise if possible.
    deferred.reject(error)
  })

  socket.addEventListener('message', function (message) {
    this_._jsonRpc.write(message.data)
  })

  socket.addEventListener('close', function () {
    this_._connection = null
    this_._socket = null

    this_._jsonRpc.failPendingRequests(new ConnectionError())

    // Only emit this event if connected before.
    if (deferred.promise.isFulfilled()) {
      this_.emit('disconnected')
    }
  })

  return deferred.promise
}

Api.prototype.call = function (method, params) {
  var jsonRpc = this._jsonRpc

  return this.connect().then(function () {
    return jsonRpc.request(method, params)
  })
}

module.exports = Api
