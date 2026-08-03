import assert from 'node:assert/strict'
import { createServer, type Server, type Socket } from 'node:net'
import { once } from 'node:events'
import { describe, it } from 'node:test'

import {
  DATA_IN_FLAG_FINAL,
  DATA_IN_FLAG_STATUS,
  FLAG_FINAL,
  InitiatorOpcode,
  ISCSI_VERSION,
  LOGIN_FLAG_TRANSIT,
  LoginStage,
  RESERVED_TAG,
  ScsiStatus,
  TargetOpcode,
} from './constants.mjs'
import { IscsiInitiator } from './initiator.mjs'
import { allocBhs, assemblePdu, type IncomingPdu, readPdu } from './pdu.mjs'

const IQN = 'iqn.2024-01.tech.vates:nop-test'
const BLOCK_SIZE = 512
const BLOCK_COUNT = 2048

/**
 * A target that speaks just enough to get a session up — login, READ
 * CAPACITY(16), READ(16) — and can then ping the initiator on demand, which
 * the real {@link IscsiTarget} never does. Everything here is about what the
 * *initiator* does with an unsolicited NOP-In.
 */
class PingingTarget {
  readonly #server: Server
  #socket?: Socket
  /** PDUs received from the initiator after the session was established. */
  readonly received: Array<IncomingPdu> = []
  #statSN = 0

  constructor() {
    this.#server = createServer(socket => {
      this.#socket = socket
      socket.setNoDelay(true)
      this.#serve(socket).catch(() => {}) // the initiator hanging up is normal
    })
  }

  async listen(): Promise<number> {
    this.#server.listen(0, '127.0.0.1')
    await once(this.#server, 'listening')
    return (this.#server.address() as { port: number }).port
  }

  async close(): Promise<void> {
    this.#socket?.destroy()
    this.#server.close()
  }

  #send(socket: Socket, buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      socket.write(buffer, error => (error ? reject(error) : resolve()))
    })
  }

  /** Ping the initiator the way a target does when the session goes quiet. */
  async ping(targetTransferTag: number, data = Buffer.alloc(0)): Promise<void> {
    const socket = this.#socket
    assert.ok(socket !== undefined, 'no initiator connected')
    const bhs = allocBhs(TargetOpcode.NOP_IN)
    bhs[1] = FLAG_FINAL
    bhs.writeUInt32BE(RESERVED_TAG, 16) // ITT: unsolicited, so none
    bhs.writeUInt32BE(targetTransferTag, 20)
    bhs.writeUInt32BE(this.#statSN, 24) // NOP-In does not advance StatSN
    await this.#send(socket, assemblePdu(bhs, data))
  }

  /** Resolves once the initiator has sent a PDU with `opcode`. */
  async waitFor(opcode: number, timeoutMs = 2000): Promise<IncomingPdu> {
    const deadline = Date.now() + timeoutMs
    for (;;) {
      const found = this.received.find(pdu => pdu.opcode === opcode)
      if (found !== undefined) {
        return found
      }
      assert.ok(Date.now() < deadline, `initiator never sent opcode 0x${opcode.toString(16)}`)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  async #serve(socket: Socket): Promise<void> {
    let established = false
    for (;;) {
      const pdu = await readPdu(socket)
      if (pdu === null) {
        return
      }
      if (established) {
        this.received.push(pdu)
      }
      switch (pdu.opcode) {
        case InitiatorOpcode.LOGIN_REQUEST:
          await this.#sendLoginResponse(socket, pdu)
          established = true
          break
        case InitiatorOpcode.SCSI_COMMAND:
          await this.#sendReadData(socket, pdu)
          break
        case InitiatorOpcode.LOGOUT_REQUEST: {
          const bhs = allocBhs(TargetOpcode.LOGOUT_RESPONSE)
          bhs[1] = FLAG_FINAL
          bhs.writeUInt32BE(pdu.itt, 16)
          bhs.writeUInt32BE(this.#statSN++, 24)
          await this.#send(socket, assemblePdu(bhs))
          return
        }
        default: // NOP-Out replies land in `received`; nothing to answer
          break
      }
    }
  }

  async #sendLoginResponse(socket: Socket, request: IncomingPdu): Promise<void> {
    const bhs = allocBhs(TargetOpcode.LOGIN_RESPONSE)
    bhs[1] = LOGIN_FLAG_TRANSIT | (LoginStage.OPERATIONAL_NEGOTIATION << 2) | LoginStage.FULL_FEATURE_PHASE
    bhs[2] = ISCSI_VERSION
    bhs[3] = ISCSI_VERSION
    request.bhs.copy(bhs, 8, 8, 14) // echo ISID
    bhs.writeUInt16BE(1, 14) // TSIH
    bhs.writeUInt32BE(request.itt, 16)
    bhs.writeUInt32BE(this.#statSN++, 24)
    await this.#send(socket, assemblePdu(bhs))
  }

  /** Answer any read-type command with a single Data-In carrying GOOD status. */
  async #sendReadData(socket: Socket, command: IncomingPdu): Promise<void> {
    const cdb = command.bhs.subarray(32, 48)
    const expectedLength = command.readU32(20)
    let payload
    if (cdb[0] === 0x9e) {
      // SERVICE ACTION IN(16) / READ CAPACITY(16)
      payload = Buffer.alloc(expectedLength)
      payload.writeBigUInt64BE(BigInt(BLOCK_COUNT - 1), 0)
      payload.writeUInt32BE(BLOCK_SIZE, 8)
    } else {
      payload = Buffer.alloc(expectedLength, 0x5a)
    }

    const bhs = allocBhs(TargetOpcode.SCSI_DATA_IN)
    bhs[1] = DATA_IN_FLAG_FINAL | DATA_IN_FLAG_STATUS
    bhs[3] = ScsiStatus.GOOD
    bhs.writeUInt32BE(command.itt, 16)
    bhs.writeUInt32BE(RESERVED_TAG, 20)
    bhs.writeUInt32BE(this.#statSN++, 24)
    await this.#send(socket, assemblePdu(bhs, payload))
  }
}

/** Run `body` against a connected initiator, always tearing both ends down. */
const withSession = async (body: (initiator: IscsiInitiator, target: PingingTarget) => Promise<void>) => {
  const target = new PingingTarget()
  const port = await target.listen()
  const initiator = new IscsiInitiator({
    host: '127.0.0.1',
    port,
    targetIqn: IQN,
    messageTimeoutMs: 5000,
  })
  await initiator.connect()
  try {
    await body(initiator, target)
  } finally {
    await initiator.close()
    await target.close()
  }
}

describe('NOP-In keepalives', () => {
  // The read loop used to stop as soon as no read was outstanding, and it is
  // the only reader of the socket — so a ping arriving while idle sat unread in
  // a paused stream. Targets drop a session whose pings go unanswered (30s on
  // LIO by default), and nothing here reconnects, so an idle mount died.
  it('are answered while the session is idle', async () => {
    await withSession(async (initiator, target) => {
      // no read in flight, and none will be
      await target.ping(7)

      const reply = await target.waitFor(InitiatorOpcode.NOP_OUT)
      assert.equal(reply.readU32(20), 7) // echoes the Target Transfer Tag
      assert.equal(reply.itt, RESERVED_TAG) // unsolicited reply, so no ITT
      assert.notEqual(reply.bhs[0] & 0x40, 0) // immediate
    })
  })

  it('echo the ping payload back', async () => {
    await withSession(async (initiator, target) => {
      const ping = Buffer.from('are you there')
      await target.ping(9, ping)

      const reply = await target.waitFor(InitiatorOpcode.NOP_OUT)
      assert.deepEqual(reply.data, ping)
    })
  })

  it('are answered between reads, without disturbing them', async () => {
    await withSession(async (initiator, target) => {
      assert.equal((await initiator.read(0, BLOCK_SIZE)).length, BLOCK_SIZE)

      await target.ping(11)
      await target.waitFor(InitiatorOpcode.NOP_OUT)

      // the session is still usable afterwards
      const data = await initiator.read(BLOCK_SIZE, BLOCK_SIZE)
      assert.deepEqual(data, Buffer.alloc(BLOCK_SIZE, 0x5a))
    })
  })

  it('are ignored when they are a reply to our own ping', async () => {
    await withSession(async (initiator, target) => {
      // a NOP-In with no Target Transfer Tag is a reply, not a ping: answering
      // it would start an endless exchange
      await target.ping(RESERVED_TAG)
      await new Promise(resolve => setTimeout(resolve, 200))

      assert.equal(
        target.received.some(pdu => pdu.opcode === InitiatorOpcode.NOP_OUT),
        false
      )
      // and the session still works
      assert.equal((await initiator.read(0, BLOCK_SIZE)).length, BLOCK_SIZE)
    })
  })
})

describe('session teardown', () => {
  it('logs out cleanly even though the read loop owns the socket', async () => {
    const target = new PingingTarget()
    const port = await target.listen()
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN, messageTimeoutMs: 5000 })
    await initiator.connect()

    await initiator.close()

    // the Logout Request reached the target, i.e. `close()` did not give up on
    // its own response for lack of a reader
    await target.waitFor(InitiatorOpcode.LOGOUT_REQUEST)
    await target.close()
  })

  it('fails a read with the reason the session died, rather than timing out', async () => {
    const target = new PingingTarget()
    const port = await target.listen()
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN, messageTimeoutMs: 5000 })
    await initiator.connect()

    await target.close() // target vanishes while the initiator is idle
    await new Promise(resolve => setTimeout(resolve, 100))

    const started = Date.now()
    await assert.rejects(initiator.read(0, BLOCK_SIZE), /connection closed/)
    // far below messageTimeoutMs: the dead session is known, not discovered
    assert.ok(Date.now() - started < 1000)
  })
})
