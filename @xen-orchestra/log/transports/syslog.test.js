'use strict'

const assert = require('node:assert/strict')
const dgram = require('node:dgram')
const { describe, it } = require('node:test')

const net = require('node:net')

const createTransport = require('./syslog.js')
const Log = require('../_Log.js')
const { dedupe } = require('../dedupe.js')

describe('syslog transport', () => {
  it('rejects certificateAuthorities which is not a list of paths', () => {
    for (const certificateAuthorities of ['/etc/ssl/certs/ca.pem', { ca: '/etc/ssl/certs/ca.pem' }, [42]]) {
      assert.throws(
        () => createTransport({ target: 'tls://localhost', certificateAuthorities }),
        /certificateAuthorities must be a list of paths, e\.g\. certificateAuthorities = \['/
      )
    }
  })

  it('closes its client', async () => {
    const server = dgram.createSocket('udp4')
    await new Promise(resolve => server.bind(0, '127.0.0.1', resolve))
    const received = new Promise(resolve => server.once('message', resolve))
    try {
      const transport = createTransport(`udp://127.0.0.1:${server.address().port}`)
      await transport({ level: 30, message: 'foo', namespace: 'ns', time: new Date() })
      assert.match(String(await received), / ns - foo$/)

      transport.close()
    } finally {
      server.close()
    }
  })

  // the summary of the duplicates is sent when the transport is replaced, e.g.
  // on a configuration change, and must not be lost by the closing client
  describe('delivers the summary flushed by dedupe when closed', () => {
    const logTwice = transport => {
      const log = new Log(undefined, 30, 'ns', 'foo')
      transport(log)
      transport(log)
      transport(log)
      transport.close()
    }

    it('over UDP, while the host name is being resolved', async () => {
      const server = dgram.createSocket('udp4')
      await new Promise(resolve => server.bind(0, '127.0.0.1', resolve))
      const messages = []
      server.on('message', message => messages.push(String(message)))
      try {
        logTwice(dedupe({ transport: createTransport(`udp://localhost:${server.address().port}`) }))
        await new Promise(resolve => setTimeout(resolve, 300))
        assert.equal(messages.length, 2)
        assert.match(messages[1], /duplicates of the previous log were hidden$/)
      } finally {
        server.close()
      }
    })

    it('over TCP, while the connection is being established', async () => {
      let data = ''
      const server = net.createServer(socket => socket.on('data', chunk => (data += chunk)))
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
      try {
        logTwice(dedupe({ transport: createTransport(`tcp://127.0.0.1:${server.address().port}`) }))
        await new Promise(resolve => setTimeout(resolve, 300))
        const lines = data.split('\n').filter(Boolean)
        assert.equal(lines.length, 2)
        assert.match(lines[1], /duplicates of the previous log were hidden$/)
      } finally {
        server.close()
      }
    })
  })
})
