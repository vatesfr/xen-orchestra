import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { describe, it } from 'node:test'

import { findFreePort } from './_nbdkit.mjs'
import { getCertificateThumbprint } from './_thumbprint.mjs'

const noop = () => {}

// the successful path needs a certificate, so it is only exercised against a real host: what is
// covered here are the two failures which used to freeze or terminate the process
describe('getCertificateThumbprint', function () {
  it('does not set the TLS server name when the host is an IP address', async function () {
    // RFC 6066 forbids it, and node warns `DeprecationWarning DEP0123` before ignoring it
    const warnings = []
    const onWarning = warning => warnings.push(warning)
    process.on('warning', onWarning)

    const port = await findFreePort()
    try {
      await getCertificateThumbprint('127.0.0.1', { port, timeout: 500 }).catch(noop)
      // the warning is emitted asynchronously
      await new Promise(resolve => setImmediate(resolve))
      assert.deepEqual(
        warnings.filter(({ code }) => code === 'DEP0123'),
        []
      )
    } finally {
      process.off('warning', onWarning)
    }
  })

  it('rejects when nothing listens', async function () {
    const port = await findFreePort()

    await assert.rejects(getCertificateThumbprint('127.0.0.1', { port, timeout: 2e3 }), error => {
      assert.match(error.message, /^can't read the certificate of 127\.0\.0\.1:/)
      assert.equal(error.code, 'ECONNREFUSED')
      return true
    })
  })

  it('gives up when the handshake never completes', async function () {
    // a port accepting the connection then staying silent, as a black holed host does
    const server = createServer()
    const port = await findFreePort()
    await new Promise(resolve => server.listen(port, '127.0.0.1', resolve))

    try {
      await assert.rejects(getCertificateThumbprint('127.0.0.1', { port, timeout: 50 }), {
        message: `no TLS handshake with 127.0.0.1:${port} after 50ms`,
      })
    } finally {
      server.close()
    }
  })
})
