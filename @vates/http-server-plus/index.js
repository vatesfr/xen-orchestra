'use strict'

// ===================================================================

const EventEmitter = require('events').EventEmitter
const formatUrl = require('url').format
const fromEvent = require('promise-toolbox/fromEvent')
const inherits = require('util').inherits
const resolvePath = require('path').resolve

// ===================================================================

const forwardedEvents = [
  'checkContinue',
  'checkExpectation',
  'clientError',
  'connect',
  'connection',
  'listening',
  'request',
  'upgrade',
]

function extractProperty(obj, prop) {
  const value = obj[prop]
  if (value !== undefined) {
    delete obj[prop]
    return value
  }
}

function forOwn(obj, cb) {
  const keys = Object.keys(obj)
  for (let i = 0, n = keys.length; i < n; ++i) {
    cb(obj[keys[i]])
  }
}

function getSystemdFd(index) {
  if (process.pid !== +process.env.LISTEN_PID) {
    throw new Error('systemd sockets are not meant for us (LISTEN_PID)')
  }

  const listenFds = process.env.LISTEN_FDS
  if (listenFds == null) {
    throw new Error('no systemd sockets found (LISTEN_FDS)')
  }
  const max = listenFds - 1

  if (index > max) {
    throw new Error('no such systemd socket found')
  }

  return index + 3 // 3 = SD_LISTEN_FDS_START
}

const isEmpty = obj => Object.keys(obj).length === 0

// ===================================================================

function onNewListener(event, listener) {
  if (forwardedEvents.includes(event)) {
    forOwn(this._servers, server => {
      server.on(event, listener)
    })
  }
}

function onRemoveListener(event, listener) {
  if (forwardedEvents.includes(event)) {
    forOwn(this._servers, server => {
      server.off(event, listener)
    })
  }
}

function Server(opts) {
  EventEmitter.call(this)

  this._createServer = (opts != null && opts.createServer) || require('http').createServer
  this._createSecureServer = (opts != null && opts.createSecureServer) || require('https').createServer
  this._servers = Object.create(null)

  this.on('removeListener', onRemoveListener).on('newListener', onNewListener)
}
inherits(Server, EventEmitter)

const proto = Server.prototype

function getAddress(serverId) {
  return this[serverId].address()
}
proto.addresses = function Server$addresses() {
  const servers = this._servers
  return Object.keys(servers).map(getAddress, servers)
}

function close(server) {
  server.close()
}

proto.close = function Server$close(callback) {
  if (callback) {
    this.once('close', callback)
  }

  // Emit the close event even if there are no registered servers.
  if (isEmpty(this._servers)) {
    const self = this
    setImmediate(function () {
      self.emit('close')
    })
    return Promise.resolve()
  }
  // Closes each servers.
  forOwn(this._servers, close)

  return fromEvent(this, 'close')
}

let nextId = 0
proto.listen = function Server$listen(opts) {
  opts = Object.assign({}, opts)

  if (opts.hostname === 'localhost') {
    return Promise.all([
      this.listen(Object.assign(opts, { hostname: '::1' })),
      this.listen(Object.assign(opts, { hostname: '127.0.0.1' })),
    ]).then(addresses => addresses[0])
  }

  const hostname = extractProperty(opts, 'hostname')
  let port = extractProperty(opts, 'port')
  const systemdSocket = extractProperty(opts, 'systemdSocket')
  let fd = extractProperty(opts, 'fd')
  let socket = extractProperty(opts, 'socket')

  const servers = this._servers

  let server, protocol
  if (opts.pfx || opts.SNICallback || (opts.cert && opts.key)) {
    server = this._createSecureServer(opts)
    protocol = 'https'
  } else {
    server = this._createServer(opts)
    protocol = 'http'
  }

  const id = nextId++
  servers[id] = server

  if (systemdSocket != null) {
    fd = getSystemdFd(systemdSocket)
  }

  // Compute a temporary nice address to display in case of error.
  let niceAddress
  if (fd != null) {
    server.listen({ fd })
    niceAddress = protocol + '://<fd:' + fd + '>'
  } else if (socket != null) {
    socket = resolvePath(socket)
    server.listen(socket)
    niceAddress = protocol + '://' + socket
  } else {
    if (port == null) {
      port = protocol === 'https' ? 443 : 80
    }
    server.listen(port, hostname)
    niceAddress = formatUrl({
      protocol,

      // Hostname default to localhost.
      hostname: hostname || 'localhost',

      // No port means random, unknown for now.
      port: port || '<unknown>',
    })
  }

  const emit = this.emit.bind(this)
  server.once('close', function onClose() {
    delete servers[id]

    if (isEmpty(servers)) {
      emit('close')
    }
  })

  server.on('error', function onError() {
    delete servers[id]

    // FIXME: Should it be forwarded and be fatal if there are no
    // listeners?
  })

  forwardedEvents.forEach(event => {
    this.listeners(event).forEach(listener => {
      server.on(event, listener)
    })
  })

  return fromEvent(server, 'listening').then(
    function () {
      const address = server.address()
      if (typeof address === 'string') {
        return protocol + '://' + address
      }
      return formatUrl({
        protocol,
        hostname: address.address,
        port: address.port,
      })
    },
    function (error) {
      error.niceAddress = niceAddress
      throw error
    }
  )
}

function ref(server) {
  server.ref()
}

proto.ref = function Server$ref() {
  forOwn(this._servers, ref)
}

function unref(server) {
  server.unref()
}

proto.unref = function Server$unref() {
  forOwn(this._servers, unref)
}

// ===================================================================

module.exports = exports = Server

exports.create = function create(opts, requestListener) {
  if (typeof opts === 'function') {
    requestListener = opts
    opts = undefined
  }

  const server = new Server(opts)
  if (requestListener !== undefined) {
    server.on('request', requestListener)
  }
  return server
}
