'use strict'

// ===================================================================

const assert = require('assert/strict')
const { EventEmitter } = require('events')
const resolvePath = require('path').resolve
const { describe, it } = require('node:test')

const HttpServerPlus = require('./')

// ===================================================================

// Creates a minimal mock server that can be used as a drop-in for http/https.Server.
// `address` is the value returned by mock.address() — use an object for TCP, a string for sockets.
function createMock(address) {
  const mock = new EventEmitter()
  mock.listen = function () {
    setImmediate(() => this.emit('listening'))
  }
  mock.address = () => address
  mock.close = function () {
    setImmediate(() => this.emit('close'))
  }
  return mock
}

// ===================================================================

describe('HttpServerPlus', function () {
  describe('#create()', function () {
    it('creates a new instance', function () {
      assert(HttpServerPlus.create() instanceof HttpServerPlus)
    })

    it('can register a `request` listener', function () {
      const listener = function () {}
      const server = HttpServerPlus.create(listener)

      assert.deepEqual(server.listeners('request'), [listener])
    })
  })

  describe('.addresses()', function () {
    it('returns the list of addresses the server is listening at', function () {
      const addr = { address: '127.0.0.1', port: 8080, family: 'IPv4' }
      const mock = createMock(addr)
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ port: 8080 }).then(function () {
        assert.deepEqual(server.addresses(), [addr])
        return server.close()
      })
    })
  })

  describe('.niceAddresses()', function () {
    it('returns the list of human readable addresses the server is listening at', function () {
      const mock = createMock({ address: '127.0.0.1', port: 8080 })
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ hostname: '127.0.0.1', port: 8080 }).then(function (address) {
        assert.deepEqual(server.niceAddresses(), [address])
        return server.close()
      })
    })
  })

  describe('secureConnection event forwarding', function () {
    function createMockHttpsServer() {
      const server = new EventEmitter()
      server.listen = function () {
        setImmediate(() => this.emit('listening'))
      }
      server.address = () => ({ address: '127.0.0.1', port: 8443 })
      server.close = function () {
        setImmediate(() => this.emit('close'))
      }
      return server
    }

    function createServerWithMock() {
      let mockServer
      const server = HttpServerPlus.create({
        createSecureServer: () => {
          mockServer = createMockHttpsServer()
          return mockServer
        },
      })
      return {
        server,
        getMock: () => mockServer,
      }
    }

    it('forwards secureConnection to listeners registered before listen()', function () {
      const { server, getMock } = createServerWithMock()

      const received = []
      server.on('secureConnection', socket => received.push(socket))

      const fakeSocket = {}
      return server.listen({ cert: 'fake-cert', key: 'fake-key' }).then(function () {
        getMock().emit('secureConnection', fakeSocket)
        assert.deepEqual(received, [fakeSocket])
        return server.close()
      })
    })

    it('forwards secureConnection to listeners registered after listen()', function () {
      const { server, getMock } = createServerWithMock()

      return server.listen({ cert: 'fake-cert', key: 'fake-key' }).then(function () {
        const received = []
        server.on('secureConnection', socket => received.push(socket))

        const fakeSocket = {}
        getMock().emit('secureConnection', fakeSocket)
        assert.deepEqual(received, [fakeSocket])
        return server.close()
      })
    })

    it('stops forwarding secureConnection after listener is removed', function () {
      const { server, getMock } = createServerWithMock()

      const received = []
      const listener = socket => received.push(socket)
      server.on('secureConnection', listener)

      return server.listen({ cert: 'fake-cert', key: 'fake-key' }).then(function () {
        server.off('secureConnection', listener)

        getMock().emit('secureConnection', {})
        assert.deepEqual(received, [])
        return server.close()
      })
    })
  })

  describe('.listen()', function () {
    it('can use a host:port', function () {
      let listenArgs
      const mock = createMock({ address: '127.0.0.1', port: 8080 })
      mock.listen = function (...args) {
        listenArgs = args
        setImmediate(() => this.emit('listening'))
      }
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ hostname: '127.0.0.1', port: 8080 }).then(function () {
        assert.deepEqual(listenArgs, [8080, '127.0.0.1'])
        return server.close()
      })
    })

    it('can use a systemd socket', function () {
      const SD_LISTEN_FDS_START = 3
      const SOCKET_INDEX = 0

      let listenArgs
      const mock = createMock('http://<fd:3>')
      mock.listen = function (...args) {
        listenArgs = args
        setImmediate(() => this.emit('listening'))
      }

      const server = HttpServerPlus.create({ createServer: () => mock })

      const env = process.env
      env.LISTEN_FDS = String(SOCKET_INDEX + 1)
      env.LISTEN_PID = String(process.pid)

      return server.listen({ systemdSocket: SOCKET_INDEX }).then(function () {
        delete env.LISTEN_FDS
        delete env.LISTEN_PID

        assert.deepEqual(listenArgs, [{ fd: SOCKET_INDEX + SD_LISTEN_FDS_START }])
        return server.close()
      })
    })

    it('can use a socket', function () {
      const socketPath = '/tmp/http-server-plus-test.sock'
      let listenArgs
      const mock = createMock(socketPath)
      mock.listen = function (...args) {
        listenArgs = args
        setImmediate(() => this.emit('listening'))
      }
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ socket: socketPath }).then(function () {
        assert.deepEqual(listenArgs, [resolvePath(socketPath)])
        return server.close()
      })
    })

    it('can use a HTTPS certificate', function () {
      let capturedOpts
      const mock = createMock({ address: '127.0.0.1', port: 8443 })
      const server = HttpServerPlus.create({
        createSecureServer: opts => {
          capturedOpts = opts
          return mock
        },
      })

      return server.listen({ cert: 'my-cert', key: 'my-key', port: 8443 }).then(function (address) {
        assert.equal(capturedOpts.cert, 'my-cert')
        assert.equal(capturedOpts.key, 'my-key')
        assert.ok(address.startsWith('https://'), `expected https URL, got: ${address}`)
        return server.close()
      })
    })

    it('returns a promise which will resolve once listening', function () {
      const mock = createMock({ address: '127.0.0.1', port: 8080 })
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ port: 8080 }).then(function (address) {
        assert.equal(typeof address, 'string')
        assert.ok(address.startsWith('http://'), `expected http URL, got: ${address}`)
        return server.close()
      })
    })

    it('returns a promise which will reject if failure', function () {
      const listenError = new Error('EADDRINUSE')
      const mock = createMock(null)
      mock.listen = function () {
        setImmediate(() => this.emit('error', listenError))
      }
      const server = HttpServerPlus.create({ createServer: () => mock })

      return server.listen({ port: 8080 }).then(
        function () {
          assert.fail('should have rejected')
        },
        function (err) {
          assert.equal(err, listenError)
          assert.equal(typeof err.niceAddress, 'string')
        }
      )
    })
  })

  describe('.close()', function () {
    it('closes all servers', function () {
      const closed = []
      let callCount = 0

      const server = HttpServerPlus.create({
        createServer: () => {
          const id = callCount++
          const mock = createMock({ address: '127.0.0.1', port: id })
          mock.close = function () {
            closed.push(id)
            setImmediate(() => this.emit('close'))
          }
          return mock
        },
      })

      return Promise.all([server.listen({ port: 0 }), server.listen({ port: 0 })])
        .then(function () {
          return server.close()
        })
        .then(function () {
          assert.equal(closed.length, 2)
        })
    })

    it('emit the `close` event when all servers are closed', function () {
      const mock = createMock({ address: '127.0.0.1', port: 8080 })
      const server = HttpServerPlus.create({ createServer: () => mock })

      let closeEmitted = false
      server.on('close', () => {
        closeEmitted = true
      })

      return server
        .listen({ port: 8080 })
        .then(function () {
          return server.close()
        })
        .then(function () {
          assert.ok(closeEmitted)
        })
    })

    it('emit the `close` event even if there are no servers', function () {
      const server = HttpServerPlus.create()

      // close() with no servers returns Promise.resolve() immediately (before emitting
      // 'close' via setImmediate), so we must wait for the event itself, not the promise.
      return new Promise(function (resolve) {
        server.close(resolve)
      })
    })
  })
})
