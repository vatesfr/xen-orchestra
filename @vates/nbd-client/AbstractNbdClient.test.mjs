import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { setTimeout as pSleep } from 'node:timers/promises'
import { describe, it } from 'node:test'

import AbstractNbdClient from './AbstractNbdClient.mjs'
import { NBD_CMD_WRITE } from './constants.mjs'
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

// the first connection is opened on a transport nobody ever answers on: its
// handshake stalls until the message timeout, well after connect() gave up
class StallingFirstConnectClient extends InMemoryNbdClient {
  #openCalls = 0

  async _openTransport() {
    if (this.#openCalls++ === 0) {
      const transport = { readable: new PassThrough(), writable: new PassThrough() }
      this.transports.push(transport)
      return transport
    }
    return super._openTransport()
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

  it('does not let a connection which timed out disturb the next one', async () => {
    const client = new StallingFirstConnectClient({}, { connectTimeout: 50, messageTimeout: 150 })
    await assert.rejects(client.connect())

    // the previous attempt is still running: it must not publish itself, nor
    // touch the transport of this one
    await client.connect()
    try {
      // let the stalled handshake reach its message timeout
      await pSleep(250)

      assert.equal(client.connected, true)
      assert.equal(client.transports.length, 2)
      // only the stalled transport has been destroyed
      assert.deepEqual(client.destroyedTransports, [client.transports[0]])

      const block = await client.readBlock(0, BLOCK_SIZE)
      assert.ok(block.equals(DATA.subarray(0, BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
  })

  it('reads into a given target', async () => {
    const client = new InMemoryNbdClient()
    await client.connect()
    try {
      const target = Buffer.alloc(BLOCK_SIZE + 8, 0xaa)
      const block = await client.readBlock(1, BLOCK_SIZE, target.subarray(8))
      assert.equal(block.buffer, target.buffer, 'the data is written in the target memory')
      assert.ok(block.equals(DATA.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE)))
      assert.equal(target.readUInt32BE(0), 0xaaaaaaaa, 'nothing written before the target')

      // the last block of a non aligned export is shorter than the target
      const last = await client.readBlock(3, BLOCK_SIZE, Buffer.alloc(BLOCK_SIZE))
      assert.equal(last.length, DATA.length - 3 * BLOCK_SIZE)
      assert.ok(last.equals(DATA.subarray(3 * BLOCK_SIZE)))

      await assert.rejects(client.readBlock(0, BLOCK_SIZE, Buffer.alloc(BLOCK_SIZE - 1)), /target is too small/)
    } finally {
      await client.disconnect()
    }
  })

  it('reassembles answers split in arbitrary chunks', async () => {
    for (const chunkSize of [1, 7, 16, 17, BLOCK_SIZE + 3]) {
      const client = new InMemoryNbdClient({ chunkSize, answerInReverse: true })
      await client.connect()
      try {
        const blocks = await Promise.all([0, 1, 2, 3].map(index => client.readBlock(index, BLOCK_SIZE)))
        blocks.forEach((block, index) =>
          assert.ok(block.equals(DATA.subarray(index * BLOCK_SIZE, (index + 1) * BLOCK_SIZE)), `chunk ${chunkSize}`)
        )
      } finally {
        await client.disconnect()
      }
    }
  })

  it('times out when the server stops answering', async () => {
    const client = new InMemoryNbdClient(
      { stopAnsweringAfter: 1 },
      { messageTimeout: 100, readBlockRetries: 1, reconnectRetry: 1, waitBeforeReconnect: 0 }
    )
    await client.connect()
    try {
      const block = await client.readBlock(0, BLOCK_SIZE)
      assert.ok(block.equals(DATA.subarray(0, BLOCK_SIZE)))
      await assert.rejects(client.readBlock(1, BLOCK_SIZE), /timed out/)
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

// the first connection stops answering after the handshake, the next ones are normal
class StopAnsweringOnceClient extends AbstractNbdClient {
  data
  connections = 0

  constructor(data, options) {
    super({}, options)
    this.data = data
  }

  async _openTransport() {
    const toServer = new PassThrough()
    const toClient = new PassThrough()
    const stopAnsweringAfter = this.connections++ === 0 ? 0 : Infinity
    serveNbd({ readable: toServer, writable: toClient, data: this.data, allowWrites: true, stopAnsweringAfter }).catch(
      error => toClient.destroy(error)
    )
    return { readable: toClient, writable: toServer }
  }
}

describe('AbstractNbdClient writes', () => {
  const block = fill => Buffer.alloc(BLOCK_SIZE, fill)

  it('refuses to write on a read-only export, without sending anything', async () => {
    const client = new InMemoryNbdClient()
    await client.connect()
    try {
      assert.equal(client.readOnly, true)
      await assert.rejects(client.writeBlock(0, block(1), BLOCK_SIZE), { code: 'EROFS' })
      await assert.rejects(client.writeZeroes(0, BLOCK_SIZE), { code: 'EROFS' })
      await assert.rejects(client.flush(), { code: 'EROFS' })
      assert.ok((await client.readBlock(0, BLOCK_SIZE)).equals(DATA.subarray(0, BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
  })

  it('writes blocks, including the shorter last one', async () => {
    const data = Buffer.from(DATA)
    const client = new InMemoryNbdClient({ data, allowWrites: true })
    await client.connect()
    try {
      assert.equal(client.readOnly, false)
      assert.equal(client.canFlush, true)
      await client.writeBlock(1, block(0xaa), BLOCK_SIZE)
      await client.writeBlock(3, Buffer.alloc(100, 0xbb), BLOCK_SIZE)
      await client.flush()

      assert.ok(data.subarray(BLOCK_SIZE, 2 * BLOCK_SIZE).equals(block(0xaa)))
      assert.ok((await client.readBlock(1, BLOCK_SIZE)).equals(block(0xaa)))
      assert.ok((await client.readBlock(3, BLOCK_SIZE)).equals(Buffer.alloc(100, 0xbb)))
      // untouched
      assert.ok(data.subarray(0, BLOCK_SIZE).equals(DATA.subarray(0, BLOCK_SIZE)))

      await assert.rejects(client.writeBlock(3, block(1), BLOCK_SIZE), /must be 100 bytes/)
      await assert.rejects(client.writeBlock(4, block(1), BLOCK_SIZE), /beyond the end/)
    } finally {
      await client.disconnect()
    }
  })

  it('handles concurrent writes and reads answered out of order and in chunks', async () => {
    const data = Buffer.from(DATA)
    const client = new InMemoryNbdClient({ data, allowWrites: true, answerInReverse: true, chunkSize: 7 })
    await client.connect()
    try {
      await Promise.all([client.writeBlock(0, block(1), BLOCK_SIZE), client.writeBlock(2, block(3), BLOCK_SIZE)])
      const [first, second] = await Promise.all([client.readBlock(0, BLOCK_SIZE), client.readBlock(2, BLOCK_SIZE)])
      assert.ok(first.equals(block(1)))
      assert.ok(second.equals(block(3)))
    } finally {
      await client.disconnect()
    }
  })

  it('writes zeroes and trims', async () => {
    const data = Buffer.from(DATA)
    const client = new InMemoryNbdClient({ data, allowWrites: true })
    await client.connect()
    try {
      assert.equal(client.canWriteZeroes, true)
      assert.equal(client.canTrim, true)
      await client.writeZeroes(0, BLOCK_SIZE)
      await client.trim(1, BLOCK_SIZE)
      assert.ok(data.subarray(0, 2 * BLOCK_SIZE).equals(Buffer.alloc(2 * BLOCK_SIZE)))
    } finally {
      await client.disconnect()
    }
  })

  it('reports a write refused by the server without retrying, the connection stays usable', async () => {
    const data = Buffer.from(DATA)
    const client = new InMemoryNbdClient(
      { data, allowWrites: true, errorCode: ({ type }) => (type === NBD_CMD_WRITE ? 28 /* ENOSPC */ : 0) },
      { readBlockRetries: 3, reconnectRetry: 1, waitBeforeReconnect: 0 }
    )
    await client.connect()
    try {
      await assert.rejects(client.writeBlock(0, block(1), BLOCK_SIZE), { code: 'ENOSPC', nbdError: 28 })
      assert.equal(client.transports.length, 1, 'not retried')
      assert.ok((await client.readBlock(0, BLOCK_SIZE)).equals(DATA.subarray(0, BLOCK_SIZE)))
      await client.flush()
    } finally {
      await client.disconnect()
    }
  })

  it('retries a write after a reconnection when the server stops answering', async () => {
    const data = Buffer.from(DATA)
    const client = new StopAnsweringOnceClient(data, {
      messageTimeout: 100,
      readBlockRetries: 2,
      reconnectRetry: 1,
      waitBeforeReconnect: 0,
    })
    await client.connect()
    try {
      await client.writeBlock(2, block(9), BLOCK_SIZE)
      assert.equal(client.connections, 2)
      assert.ok(data.subarray(2 * BLOCK_SIZE, 3 * BLOCK_SIZE).equals(block(9)))
    } finally {
      await client.disconnect()
    }
  })
})
