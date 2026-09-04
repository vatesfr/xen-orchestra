import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSecureContext, TLSSocket } from 'node:tls'
import { createServer } from 'node:net'
import { readChunkStrict } from '@vates/read-chunk'
import { readFileSync } from 'node:fs'

import NbdClient from './index.mjs'
import {
  INIT_PASSWD,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_FLAG_READ_ONLY,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_OPT_STARTTLS,
  NBD_REP_ERR_UNSUP,
  NBD_REPLY_ACK,
  OPTS_MAGIC,
} from './constants.mjs'

// The handshake is private and socket driven, so the seam is a real socket: these tests drive
// connect(), the public API, against a fake server whose bytes we control. Mocking node:net
// instead would test our idea of a socket rather than the wire protocol, which is the thing that
// was actually wrong.
//
// It is a unit test and not an integration one: same process, loopback only, no external binary
// (unlike tests/nbdclient.integ.mjs which needs nbdkit), a few milliseconds per case. Same shape
// as packages/xo-server/src/xo-mixins/_rest-api.test.mjs, which starts a node:http server.

const EXPORT_NAME = 'MY_EXPORT'
const EXPORT_SIZE = 4n * 1024n * 1024n

const TLS_KEY = readFileSync(new URL('./tests/server-key.pem', import.meta.url))
const TLS_CERT = readFileSync(new URL('./tests/server-cert.pem', import.meta.url))

/**
 * A NBD server speaking just enough of the fixed newstyle handshake.
 *
 * @param {object} [options]
 * @param {Record<number, { type: number, reason?: string }>} [options.optionReplies] per option
 * reply to send instead of an ACK
 */
async function startFakeServer({ optionReplies = {} } = {}) {
  const state = { error: undefined, exportName: undefined, optionsReceived: [], tlsUpgraded: false }

  const server = createServer(plainSocket => {
    // a client-side destroy() must not crash the run
    plainSocket.on('error', () => {})
    ;(async () => {
      let socket = plainSocket
      // never attach a 'data' handler: readChunk needs the socket paused
      const read = size => readChunkStrict(socket, size)

      // greeting: 8 bytes magic, 8 bytes option magic, 2 bytes handshake flags.
      // NBD_FLAG_NO_ZEROES must NOT be advertised: the client does not send NBD_FLAG_C_NO_ZEROES
      // and unconditionally reads the 134 bytes of export info
      const greeting = Buffer.alloc(18)
      INIT_PASSWD.copy(greeting, 0)
      OPTS_MAGIC.copy(greeting, 8)
      greeting.writeUInt16BE(NBD_FLAG_FIXED_NEWSTYLE, 16)
      socket.write(greeting)

      assert.strictEqual((await read(4)).readUInt32BE(0), NBD_FLAG_FIXED_NEWSTYLE, 'client flags')

      while (true) {
        assert.ok((await read(8)).equals(OPTS_MAGIC), 'option magic')
        const header = await read(8)
        const option = header.readUInt32BE(0)
        const length = header.readUInt32BE(4)
        const payload = length > 0 ? await read(length) : Buffer.alloc(0)
        state.optionsReceived.push(option)

        if (option === NBD_OPT_EXPORT_NAME) {
          // no option reply for this one: the export info comes straight away
          state.exportName = payload.toString('utf8')
          const info = Buffer.alloc(134)
          info.writeBigUInt64BE(EXPORT_SIZE, 0)
          // 3, what XAPI sends
          info.writeUInt16BE(NBD_FLAG_HAS_FLAGS | NBD_FLAG_READ_ONLY, 8)
          socket.write(info)
          // required, not cosmetic: without it the server never sees the client's FIN, so
          // server.close(cb) never calls back and the test hangs
          socket.resume()
          return
        }

        const { type = NBD_REPLY_ACK, reason = '' } = optionReplies[option] ?? {}
        const reasonBuffer = Buffer.from(reason, 'utf8')
        const reply = Buffer.alloc(20 + reasonBuffer.length)
        reply.writeBigUInt64BE(NBD_OPT_REPLY_MAGIC, 0)
        reply.writeUInt32BE(option, 8)
        // must be unsigned: writeInt32BE(2 ** 31 + 1) throws ERR_OUT_OF_RANGE
        reply.writeUInt32BE(type, 12)
        // taken from the buffer, never from reason.length, or a non-ASCII reason truncates
        reply.writeUInt32BE(reasonBuffer.length, 16)
        reasonBuffer.copy(reply, 20)
        socket.write(reply)

        if (option === NBD_OPT_STARTTLS && type === NBD_REPLY_ACK) {
          const tlsSocket = new TLSSocket(plainSocket, {
            isServer: true,
            secureContext: createSecureContext({ cert: TLS_CERT, key: TLS_KEY }),
          })
          await new Promise(resolve => tlsSocket.once('secure', resolve))
          state.tlsUpgraded = true
          // the following options are read from the TLS socket
          socket = tlsSocket
        }
      }
    })().catch(error => {
      state.error = error
    })
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  state.port = server.address().port
  // close() only: destroying the server side sockets makes the process die on an unhandled
  // ECONNRESET, readChunk having removed its listeners once settled
  state.stop = () => new Promise(resolve => server.close(resolve))
  return state
}

const makeClient = (server, cert) =>
  new NbdClient({ address: '127.0.0.1', port: server.port, exportname: EXPORT_NAME, cert })

const rejection = promise =>
  promise.then(
    () => assert.fail('connect() should have rejected'),
    error => error
  )

describe('NbdClient TLS negotiation', () => {
  // '' is what XAPI returns for a network whose purpose is insecure_nbd
  for (const [label, cert] of [
    ['no cert', undefined],
    ['an empty string', ''],
    ['an empty buffer', Buffer.alloc(0)],
  ]) {
    it(`does not attempt STARTTLS with ${label}`, async () => {
      const server = await startFakeServer()
      try {
        const client = makeClient(server, cert)
        await client.connect()

        assert.deepStrictEqual(server.optionsReceived, [NBD_OPT_EXPORT_NAME])
        // proves the whole negotiation completed, not just that an option was skipped
        assert.strictEqual(server.exportName, EXPORT_NAME)
        assert.strictEqual(client.exportSize, EXPORT_SIZE)
        assert.strictEqual(server.error, undefined)

        await client.disconnect()
      } finally {
        await server.stop()
      }
    })
  }

  it('upgrades to TLS when a cert is advertised', async () => {
    const server = await startFakeServer()
    try {
      const client = makeClient(server, TLS_CERT.toString('utf8'))
      await client.connect()

      assert.deepStrictEqual(server.optionsReceived, [NBD_OPT_STARTTLS, NBD_OPT_EXPORT_NAME])
      assert.strictEqual(server.tlsUpgraded, true)
      // the export name was negotiated after the upgrade, so this proves the client really talks
      // through the TLS socket and not the plain one
      assert.strictEqual(server.exportName, EXPORT_NAME)
      assert.strictEqual(client.exportSize, EXPORT_SIZE)

      await client.disconnect()
    } finally {
      await server.stop()
    }
  })
})

describe('NbdClient option refusal', () => {
  it('reports the reason the server refused an option', async () => {
    const server = await startFakeServer({
      optionReplies: {
        [NBD_OPT_STARTTLS]: { type: NBD_REP_ERR_UNSUP, reason: 'TLS is not configuré on this server\n' },
      },
    })
    try {
      const error = await rejection(makeClient(server, TLS_CERT.toString('utf8')).connect())

      assert.strictEqual(error.code, 'NBD_REP_ERR_UNSUP')
      // full equality pins three things at once: the unsigned read of 0x80000001 (a signed read
      // would fall back to the raw reply type), the UTF-8 decoding, and the whitespace collapse
      assert.strictEqual(
        error.message,
        'NBD server refused NBD_OPT_STARTTLS with NBD_REP_ERR_UNSUP: TLS is not configuré on this server'
      )
      // the one line contract MultiNbdClient depends on to build the backup report
      assert.ok(!error.message.includes('\n'))
      // the client gave up instead of pressing on to the export name
      assert.deepStrictEqual(server.optionsReceived, [NBD_OPT_STARTTLS])
    } finally {
      await server.stop()
      // the client wrote nothing more on the socket, in particular no TLS ClientHello, which the
      // fake's OPTS_MAGIC assertion would have caught
      assert.notStrictEqual(server.error?.code, 'ERR_ASSERTION')
    }
  })

  it('names a reply type it does not know, without a payload', async () => {
    const server = await startFakeServer({
      optionReplies: { [NBD_OPT_STARTTLS]: { type: 2 ** 31 + 42 } },
    })
    try {
      const error = await rejection(makeClient(server, TLS_CERT.toString('utf8')).connect())

      assert.strictEqual(error.code, 'NBD_OPT_REFUSED')
      // no dangling ': ', and it pins the `length > 0` guard: without it the client would call
      // #read(0) and fail on readChunk's own `size > 0` assertion
      assert.strictEqual(error.message, 'NBD server refused NBD_OPT_STARTTLS with reply type 0x8000002a')
    } finally {
      await server.stop()
    }
  })
})
