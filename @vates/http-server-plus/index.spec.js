'use strict'

// ===================================================================

const assert = require('assert/strict')
const tcpBind = require('tcp-bind')
const { describe, it } = require('tap').mocha

const HttpServerPlus = require('./')

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
    it.todo('returns the list of addresses the server is listening at')
  })

  describe('.niceAddresses()', function () {
    it.todo('returns the list of human readable addresses the server is listening at')
  })

  // TODO
  describe('.listen()', function () {
    it.todo('can use a host:port')

    // FIXME: `tcp-bind` does not work anymore
    it.skip('can use a systemd socket', function () {
      const SD_LISTEN_FDS_START = 3

      const server = HttpServerPlus.create()
      const fd = tcpBind(0)

      const env = process.env
      env.LISTEN_FDS = fd - SD_LISTEN_FDS_START + 1
      env.LISTEN_PID = process.pid

      return server
        .listen({
          systemdSocket: fd - SD_LISTEN_FDS_START, // systemd fds start at 3 but we have not control over it in Node.
        })
        .then(function () {
          delete env.LISTEN_FDS
          delete env.LISTEN_PID

          return server.close()
        })
    })

    it.todo('can use a socket')
    it.todo('can use a HTTPS certificate')
    it.todo('returns a promise which will resolve once listening')
    it.todo('returns a promise which will reject if failure')
  })

  describe('.close()', function () {
    it.todo('closes all servers')
    it.todo('emit the `close` event when all servers are closed')
    it.todo('emit the `close` event even if there are no servers')
  })

  // TODO
  it.todo('can be used exactly like `{http,https}.Server`')
})
