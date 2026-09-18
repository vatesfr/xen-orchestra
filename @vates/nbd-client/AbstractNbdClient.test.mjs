import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import AbstractNbdClient from './AbstractNbdClient.mjs'
import { serveNbd } from './tests/fake-nbd-server.mjs'

const BLOCK_SIZE = 512
// non aligned size, to check the truncated last block
const DATA = Buffer.alloc(BLOCK_SIZE * 3 + 100)
for (let i = 0; i < DATA.length; i += 4) {
  DATA.writeUInt32BE(i, i)
}

// exercises AbstractNbdClient without any I/O: the fake server runs in the same
// process, on the other end of two in-memory streams
class InMemoryNbdClient extends AbstractNbdClient {
  #serverOptions

  /** @type {Array<object>} */
  transports = []
  /** @type {Array<object>} */
  destroyedTransports = []
  secureTransportCalls = 0

  constructor({ exportname, ...serverOptions } = {}, options) {
    super({ exportname }, options)
    this.#serverOptions = serverOptions
  }

  async _openTransport() {
    const toServer = new PassThrough()
    const toClient = new PassThrough()
    const transport = { readable: toClient, writable: toServer }
    this.transports.push(transport)

    // the server runs alongside the client, a failure on its side is reported
    // to the client the same way a network error would be
    serveNbd({ readable: toServer, writable: toClient, data: DATA, ...this.#serverOptions }).catch(error =>
      toClient.destroy(error)
    )

    return transport
  }

  async _secureTransport(transport) {
    this.secureTransportCalls++
    return super._secureTransport(transport)
  }

  _destroyTransport(transport) {
    this.destroyedTransports.push(transport)
    super._destroyTransport(transport)
  }
}

describe('AbstractNbdClient', () => {
  it('handshakes and reads blocks', async () => {
    const client = new InMemoryNbdClient()
    await client.connect()
    try {
      assert.equal(client.exportSize, BigInt(DATA.length))
      assert.equal(client.connected, true)

      const block = await client.readBlock(1, BLOCK_SIZE)
      assert.ok(block.equals(DATA.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
    assert.equal(client.connected, false)
  })

  it('truncates the last block of a non aligned export', async () => {
    const client = new InMemoryNbdClient()
    await client.connect()
    try {
      const block = await client.readBlock(3, BLOCK_SIZE)
      assert.equal(block.length, DATA.length - 3 * BLOCK_SIZE)
      assert.ok(block.equals(DATA.subarray(3 * BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
  })

  it('handles answers coming out of order', async () => {
    const client = new InMemoryNbdClient({ answerInReverse: true })
    await client.connect()
    try {
      const [first, second] = await Promise.all([client.readBlock(0, BLOCK_SIZE), client.readBlock(1, BLOCK_SIZE)])
      assert.ok(first.equals(DATA.subarray(0, BLOCK_SIZE)))
      assert.ok(second.equals(DATA.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
  })

  it('calls _secureTransport during the handshake', async () => {
    const client = new InMemoryNbdClient()
    await client.connect()
    assert.equal(client.secureTransportCalls, 1)
    await client.disconnect()
  })

  it('does not leak the transport when the handshake fails', async () => {
    // the server expects another export name, and fails the handshake
    const client = new InMemoryNbdClient({ exportname: 'wrong', exportName: 'expected' })
    await assert.rejects(client.connect())

    assert.equal(client.connected, false)
    assert.equal(client.transports.length, 1)
    assert.deepEqual(client.destroyedTransports, client.transports)
    assert.equal(client.transports[0].writable.destroyed, true)
  })

  it('reports the errors answered by the server, after having retried', async () => {
    const client = new InMemoryNbdClient(
      { errorCode: () => 5 /* EIO */ },
      { readBlockRetries: 2, reconnectRetry: 1, waitBeforeReconnect: 0 }
    )
    await client.connect()
    try {
      await assert.rejects(client.readBlock(0, BLOCK_SIZE), /ERROR CODE/)
      // one transport for the initial connection, one for the retry
      assert.equal(client.transports.length, 2)
    } finally {
      await client.disconnect()
    }
  })

  it('does not support getMap()', async () => {
    const client = new InMemoryNbdClient()
    await assert.rejects(client.getMap(), ({ code }) => code === 'NBD_MAP_UNSUPPORTED')
  })

  it('can be disconnected without being connected', async () => {
    await new InMemoryNbdClient().disconnect()
  })
})
