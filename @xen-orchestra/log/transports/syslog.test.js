'use strict'

const assert = require('node:assert/strict')
const dgram = require('node:dgram')
const { describe, it } = require('node:test')

const createTransport = require('./syslog.js')

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
})
