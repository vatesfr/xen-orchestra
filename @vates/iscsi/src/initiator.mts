import { connect, type Socket } from 'node:net'
import { once } from 'node:events'
import { createLogger, type Logger } from '@xen-orchestra/log'
import { pTimeout } from 'promise-toolbox'

import {
  AuthMethod,
  DATA_IN_FLAG_STATUS,
  FLAG_FINAL,
  InitiatorOpcode,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
  LoginStatusClass,
  OPCODE_IMMEDIATE,
  RESERVED_TAG,
  SCSI_CMD_FLAG_READ,
  ScsiOpcode,
  ScsiStatus,
  SERVICE_ACTION_READ_CAPACITY_16,
  TargetOpcode,
} from './constants.mjs'
import { CHAP_ALGORITHM_MD5, computeResponse, decodeChapValue, encodeChapValue } from './chap.mjs'
import { parseTextKeys, serializeTextKeys } from './login.mjs'
import { allocBhs, assemblePdu, type IncomingPdu, readPdu, writePdu } from './pdu.mjs'
import type { ChapCredentials } from './types.mjs'

const log: Logger = createLogger('vates:iscsi:initiator')

const DEFAULT_PORT = 3260
const DEFAULT_MESSAGE_TIMEOUT_MS = 60_000
const DEFAULT_MAX_RECV_DATA_SEGMENT_LENGTH = 262144
const READ_CAPACITY_16_LENGTH = 32

export interface IscsiInitiatorOptions {
  /** Portal address to connect to. */
  readonly host: string
  /** Portal port. Defaults to 3260. */
  readonly port?: number
  /** Target IQN (`TargetName`) to log into. */
  readonly targetIqn: string
  /** Our initiator IQN (`InitiatorName`). Defaults to a generated one. */
  readonly initiatorIqn?: string
  /**
   * One-way CHAP responder credential. When the target requests CHAP we answer
   * its challenge with this user/secret. Omit for an unauthenticated login.
   */
  readonly chap?: ChapCredentials
  /** Per-message timeout for login/read responses, in ms. Defaults to 60000. */
  readonly messageTimeoutMs?: number
}

/** An outstanding SCSI read, keyed by its Initiator Task Tag. */
interface Pending {
  /** Preallocated buffer sized to the expected transfer length. */
  readonly buffer: Buffer
  resolve(data: Buffer): void
  reject(error: Error): void
}

/**
 * A minimal userspace iSCSI initiator (client), mirroring {@link IscsiTarget}'s
 * framing and negotiation (read-only, single connection, one LUN, digests
 * off, `ErrorRecoveryLevel=0`).
 *
 * A backlog `Map` keyed by ITT, drained by a single read loop, demultiplexes
 * responses so several reads can be outstanding at once (e.g. under a
 * `ReadAhead` disk wrapper).
 */
export class IscsiInitiator {
  readonly #host: string
  readonly #port: number
  readonly #targetIqn: string
  readonly #initiatorIqn: string
  readonly #chap?: ChapCredentials
  readonly #messageTimeoutMs: number

  #socket?: Socket
  #itt = 0
  #cmdSN = 0
  #expStatSN = 0

  #blockSize = 0
  #capacityBytes = 0

  // Outstanding reads, keyed by ITT. A single #readLoop() (guarded by #reading)
  // is the only consumer of readPdu, so it is safe to have many entries here.
  readonly #backlog = new Map<number, Pending>()
  #reading = false
  // set once `close()` starts, so the read loop's own end is not reported as a
  // fault and it stops instead of racing the socket teardown
  #closing = false
  // why the read loop stopped, when it was not us closing
  #failure?: Error
  // resolved by the read loop when the target's Logout Response arrives
  #logoutAnswered?: () => void

  constructor(options: IscsiInitiatorOptions) {
    this.#host = options.host
    this.#port = options.port ?? DEFAULT_PORT
    this.#targetIqn = options.targetIqn
    this.#initiatorIqn = options.initiatorIqn ?? 'iqn.2024-01.tech.vates:initiator'
    this.#chap = options.chap
    this.#messageTimeoutMs = options.messageTimeoutMs ?? DEFAULT_MESSAGE_TIMEOUT_MS
  }

  /** LUN logical block size in bytes (valid after {@link connect}). */
  getBlockSize(): number {
    return this.#blockSize
  }

  /** LUN capacity in bytes (valid after {@link connect}). */
  getSize(): number {
    return this.#capacityBytes
  }

  // --- lifecycle ------------------------------------------------------------

  /** Open the TCP connection, log in, and read the LUN capacity. */
  async connect(): Promise<void> {
    const socket = connect(this.#port, this.#host)
    this.#socket = socket
    try {
      await once(socket, 'connect')
      socket.setNoDelay(true)
      // A socket error with no read in flight would otherwise go unnoticed.
      socket.on('error', error => this.#rejectAll(error instanceof Error ? error : new Error(String(error))))
      // `#login` reads its own responses; from here on the read loop owns the
      // socket, and it must be running before anything can answer a NOP-In
      await this.#login()
      void this.#pump()
      await this.#readCapacity()
      log.info('session established', { target: this.#targetIqn, capacity: this.#capacityBytes })
    } catch (error) {
      socket.destroy()
      this.#socket = undefined
      throw error
    }
  }

  #requireSocket(): Socket {
    const socket = this.#socket
    if (socket === undefined) {
      throw new Error('IscsiInitiator.connect() must be called first')
    }
    return socket
  }

  #send(buffer: Buffer): Promise<void> {
    return writePdu(this.#requireSocket(), buffer, this.#messageTimeoutMs)
  }

  #nextItt(): number {
    this.#itt = (this.#itt + 1) >>> 0
    return this.#itt
  }

  /** Best-effort Logout, then close the socket. */
  async close(): Promise<void> {
    const socket = this.#socket
    if (socket === undefined) {
      return
    }
    // stops the read loop and keeps its own end from being logged as a fault
    this.#closing = true
    try {
      const bhs = allocBhs(InitiatorOpcode.LOGOUT_REQUEST | OPCODE_IMMEDIATE)
      bhs[1] = FLAG_FINAL // reason 0: close the session
      bhs.writeUInt32BE(this.#nextItt(), 16)
      bhs.writeUInt32BE(this.#cmdSN, 24)
      bhs.writeUInt32BE(this.#expStatSN, 28)
      // the read loop owns the socket, so the response comes through it: reading
      // here too would put two consumers on one stream and split PDUs between them
      const answered = new Promise<void>(resolve => {
        this.#logoutAnswered = resolve
      })
      await this.#send(assemblePdu(bhs))
      await pTimeout.call(answered, this.#messageTimeoutMs)
    } catch (error) {
      log.debug('logout failed, closing anyway', { error })
    } finally {
      this.#logoutAnswered = undefined
      this.#socket = undefined
      socket.destroy()
    }
  }

  // --- login ----------------------------------------------------------------

  /** Build the flags byte (T/CSG/NSG) of a Login Request. */
  #loginFlags(transit: boolean, csg: number, nsg: number): number {
    return (transit ? LOGIN_FLAG_TRANSIT : 0) | (csg << LOGIN_CSG_SHIFT) | (nsg & LOGIN_NSG_MASK)
  }

  async #sendLogin(itt: number, flags: number, keys: Array<[string, string]>): Promise<IncomingPdu> {
    const bhs = allocBhs(InitiatorOpcode.LOGIN_REQUEST | OPCODE_IMMEDIATE)
    bhs[1] = flags
    Buffer.from([0x80, 0, 0, 0, 0, 1]).copy(bhs, 8) // ISID (fixed; single session)
    bhs.writeUInt32BE(itt, 16)
    bhs.writeUInt32BE(this.#cmdSN, 24) // login is immediate: does not advance CmdSN
    bhs.writeUInt32BE(this.#expStatSN, 28)
    log.debug('login request', { flags: `0x${flags.toString(16)}`, keys: Object.fromEntries(keys) })
    await this.#send(assemblePdu(bhs, serializeTextKeys(keys)))

    const pdu = await pTimeout.call(readPdu(this.#requireSocket()), this.#messageTimeoutMs)
    if (pdu === null) {
      throw new Error('connection closed during login')
    }
    if (pdu.opcode !== TargetOpcode.LOGIN_RESPONSE) {
      throw new Error(`expected Login Response, got opcode 0x${pdu.opcode.toString(16)}`)
    }
    const statusClass = pdu.readU8(36)
    log.debug('login response', {
      statusClass,
      statusDetail: pdu.readU8(37),
      transit: (pdu.readU8(1) & LOGIN_FLAG_TRANSIT) !== 0,
      keys: Object.fromEntries(parseTextKeys(pdu.data)),
    })
    if (statusClass !== LoginStatusClass.SUCCESS) {
      throw new Error(
        `login rejected (status-class 0x${statusClass.toString(16)}, detail 0x${pdu.readU8(37).toString(16)})`
      )
    }
    this.#expStatSN = (pdu.readU32(24) + 1) >>> 0
    return pdu
  }

  /**
   * Drive the login: an optional CHAP security stage (we are the responder),
   * then the operational stage into the full-feature phase. All PDUs of one
   * login share a single ITT.
   */
  async #login(): Promise<void> {
    const itt = this.#nextItt()
    const names: Array<[string, string]> = [
      ['InitiatorName', this.#initiatorIqn],
      ['TargetName', this.#targetIqn],
      ['SessionType', 'Normal'],
    ]

    if (this.#chap !== undefined) {
      // Round 1: offer CHAP (falling back to None) in the security stage.
      const r1 = await this.#sendLogin(
        itt,
        this.#loginFlags(false, LoginStage.SECURITY_NEGOTIATION, LoginStage.OPERATIONAL_NEGOTIATION),
        [...names, ['AuthMethod', `${AuthMethod.CHAP},${AuthMethod.NONE}`]]
      )
      const method = parseTextKeys(r1.data).get('AuthMethod')
      log.debug('chap: target selected AuthMethod', { method })
      if (method === AuthMethod.CHAP) {
        // Round 2: propose MD5.
        const r2 = await this.#sendLogin(
          itt,
          this.#loginFlags(false, LoginStage.SECURITY_NEGOTIATION, LoginStage.OPERATIONAL_NEGOTIATION),
          [['CHAP_A', String(CHAP_ALGORITHM_MD5)]]
        )
        // Round 3: answer the target's challenge, transiting to operational.
        // (Mutual CHAP is not supported: we never challenge the target; a target
        // that *requires* mutual auth will reject this login, surfaced above.)
        const challenge = parseTextKeys(r2.data)
        const id = Number.parseInt(challenge.get('CHAP_I') ?? '', 10)
        const challengeValue = challenge.get('CHAP_C')
        if (!Number.isInteger(id) || challengeValue === undefined) {
          throw new Error('malformed CHAP challenge from target')
        }
        const response = computeResponse(id, this.#chap.secret, decodeChapValue(challengeValue))
        log.debug('chap: answering challenge', { id, user: this.#chap.user })
        await this.#sendLogin(
          itt,
          this.#loginFlags(true, LoginStage.SECURITY_NEGOTIATION, LoginStage.OPERATIONAL_NEGOTIATION),
          [
            ['CHAP_N', this.#chap.user],
            ['CHAP_R', encodeChapValue(response)],
          ]
        )
        await this.#operationalLogin(itt, [])
        return
      }
      if (method !== AuthMethod.NONE && method !== undefined) {
        throw new Error(`target selected unsupported AuthMethod=${method}`)
      }
      // Target did not require CHAP: continue straight to operational.
      await this.#operationalLogin(itt, [])
      return
    }

    // No CHAP: a single operational-stage PDU straight to the full-feature phase.
    await this.#operationalLogin(itt, names)
  }

  /** Operational-stage login PDU, transiting to the full-feature phase. */
  async #operationalLogin(itt: number, extraKeys: Array<[string, string]>): Promise<void> {
    const pdu = await this.#sendLogin(
      itt,
      this.#loginFlags(true, LoginStage.OPERATIONAL_NEGOTIATION, LoginStage.FULL_FEATURE_PHASE),
      [
        ...extraKeys,
        ['HeaderDigest', 'None'],
        ['DataDigest', 'None'],
        ['InitialR2T', 'Yes'],
        ['ImmediateData', 'No'],
        ['ErrorRecoveryLevel', '0'],
        ['MaxRecvDataSegmentLength', String(DEFAULT_MAX_RECV_DATA_SEGMENT_LENGTH)],
      ]
    )
    if ((pdu.readU8(1) & LOGIN_FLAG_TRANSIT) === 0) {
      throw new Error('target did not transit to the full-feature phase')
    }
  }

  // --- read path ------------------------------------------------------------

  /**
   * Read exactly `length` bytes from byte `offset` of the LUN. `offset` and
   * `length` must be block-aligned (multiples of {@link getBlockSize}).
   */
  read(offset: number, length: number): Promise<Buffer> {
    const blockSize = this.#blockSize
    if (offset % blockSize !== 0 || length % blockSize !== 0) {
      return Promise.reject(new Error(`unaligned read (offset ${offset}, length ${length}, block ${blockSize})`))
    }
    const cdb = Buffer.alloc(16)
    cdb[0] = ScsiOpcode.READ_16
    cdb.writeBigUInt64BE(BigInt(offset / blockSize), 2) // LBA
    cdb.writeUInt32BE(length / blockSize, 10) // transfer length, in blocks
    return this.#scsiRead(cdb, length)
  }

  /** Issue READ CAPACITY(16) and record the LUN block size and capacity. */
  async #readCapacity(): Promise<void> {
    const cdb = Buffer.alloc(16)
    cdb[0] = ScsiOpcode.SERVICE_ACTION_IN_16
    cdb[1] = SERVICE_ACTION_READ_CAPACITY_16
    cdb.writeUInt32BE(READ_CAPACITY_16_LENGTH, 10) // allocation length
    // Block size is unknown here, so bypass the alignment guard in read().
    const data = await this.#scsiRead(cdb, READ_CAPACITY_16_LENGTH)
    const maxLba = data.readBigUInt64BE(0)
    this.#blockSize = data.readUInt32BE(8)
    this.#capacityBytes = Number((maxLba + 1n) * BigInt(this.#blockSize))
    log.debug('read capacity', { blockSize: this.#blockSize, capacityBytes: this.#capacityBytes })
  }

  /** Issue a read-type SCSI command and resolve with its assembled Data-In. */
  #scsiRead(cdb: Buffer, expectedLength: number): Promise<Buffer> {
    const failure = this.#failure
    if (failure !== undefined) {
      // the session is already gone: fail with why, rather than writing into a
      // half-closed socket and waiting out the message timeout
      return Promise.reject(failure)
    }
    const socket = this.#requireSocket()
    const itt = this.#nextItt()
    const bhs = allocBhs(InitiatorOpcode.SCSI_COMMAND)
    bhs[1] = FLAG_FINAL | SCSI_CMD_FLAG_READ
    bhs.writeUInt32BE(itt, 16)
    bhs.writeUInt32BE(expectedLength, 20) // Expected Data Transfer Length
    bhs.writeUInt32BE(this.#cmdSN, 24)
    this.#cmdSN = (this.#cmdSN + 1) >>> 0
    bhs.writeUInt32BE(this.#expStatSN, 28)
    cdb.copy(bhs, 32)
    log.debug('scsi read', { itt, cdb: `0x${cdb[0].toString(16)}`, expectedLength, cmdSN: (this.#cmdSN - 1) >>> 0 })

    // Register the pending read BEFORE writing, so a fast response cannot arrive
    // before the backlog entry exists. No await between allocate → register →
    // send → pump, which keeps concurrent reads correct.
    const promise = new Promise<Buffer>((resolve, reject) => {
      this.#backlog.set(itt, { buffer: Buffer.alloc(expectedLength), resolve, reject })
    })
    writePdu(socket, assemblePdu(bhs), this.#messageTimeoutMs).catch(error => {
      const pending = this.#backlog.get(itt)
      if (pending !== undefined) {
        this.#backlog.delete(itt)
        pending.reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    void this.#pump()
    return pTimeout.call(promise, this.#messageTimeoutMs)
  }

  /**
   * Drain inbound PDUs for as long as the session lives. Only ever one runs at
   * a time, and it is the only reader of the socket after login.
   *
   * It deliberately does not stop when the backlog empties. A target sends its
   * NOP-In keepalives precisely when nothing else is going on, and it is the
   * only reader — so a loop that parked between reads would leave those pings
   * sitting unread in a paused stream. Targets drop a session whose pings go
   * unanswered (LIO's `nopin_response_timeout` is 30s by default, arrays are
   * similar), and nothing here reconnects, so the session would die during any
   * idle period: right after `connect()`, between reads, or while the consumer
   * of a mounted disk stalls.
   */
  async #pump(): Promise<void> {
    if (this.#reading) {
      return
    }
    this.#reading = true
    try {
      while (!this.#closing) {
        const socket = this.#socket
        if (socket === undefined) {
          throw new Error('connection closed')
        }
        const pdu = await readPdu(socket)
        if (pdu === null) {
          throw new Error('connection closed by target')
        }
        this.#route(pdu)
      }
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error))
      if (!this.#closing) {
        // The loop now runs while idle, so it is usually the first to notice the
        // session die — with nothing in the backlog to reject and nobody to
        // return an error to. Log it where it happens, and keep the reason so
        // later reads fail with the original cause instead of whatever the dead
        // socket produces.
        this.#failure = failure
        log.warn('read loop stopped, session is dead', { error: failure })
        this.#rejectAll(failure)
      }
    } finally {
      this.#reading = false
    }
  }

  /** Route one inbound PDU to its pending read (by ITT), completing it if done. */
  #route(pdu: IncomingPdu): void {
    switch (pdu.opcode) {
      case TargetOpcode.SCSI_DATA_IN: {
        const pending = this.#backlog.get(pdu.itt)
        if (pending === undefined) {
          return // stale/duplicate; ignore
        }
        pdu.data.copy(pending.buffer, pdu.readU32(40)) // copy at Buffer Offset
        const hasStatus = (pdu.flags & DATA_IN_FLAG_STATUS) !== 0
        log.debug('data-in', { itt: pdu.itt, offset: pdu.readU32(40), length: pdu.data.length, final: hasStatus })
        if (hasStatus) {
          this.#expStatSN = (pdu.readU32(24) + 1) >>> 0
          this.#complete(pdu.itt, pending, pdu.readU8(3))
        }
        return
      }
      case TargetOpcode.SCSI_RESPONSE: {
        const pending = this.#backlog.get(pdu.itt)
        if (pending !== undefined) {
          this.#expStatSN = (pdu.readU32(24) + 1) >>> 0
          this.#complete(pdu.itt, pending, pdu.readU8(3))
        }
        return
      }
      case TargetOpcode.NOP_IN: {
        // A target-initiated NOP ping (TTT set) must be answered to keep the
        // session alive; a NOP reply to our own ping (none here) is ignored.
        const ttt = pdu.readU32(20)
        if (ttt !== RESERVED_TAG) {
          void this.#replyNop(ttt, pdu.data)
        }
        return
      }
      case TargetOpcode.LOGOUT_RESPONSE:
        // awaited by `close()`, which cannot read the socket itself
        this.#logoutAnswered?.()
        return
      default:
        // R2T/Async/Reject are not expected on the read-only path; ignore.
        log.debug('ignoring unexpected PDU', { opcode: pdu.opcode })
    }
  }

  #complete(itt: number, pending: Pending, status: number): void {
    this.#backlog.delete(itt)
    log.debug('read complete', { itt, status, pending: this.#backlog.size })
    if (status === ScsiStatus.GOOD) {
      pending.resolve(pending.buffer)
    } else {
      pending.reject(new Error(`SCSI command failed with status 0x${status.toString(16)}`))
    }
  }

  async #replyNop(targetTransferTag: number, ping: Buffer): Promise<void> {
    const bhs = allocBhs(InitiatorOpcode.NOP_OUT | OPCODE_IMMEDIATE)
    bhs[1] = FLAG_FINAL
    bhs.writeUInt32BE(RESERVED_TAG, 16) // ITT: none (this is an unsolicited reply)
    bhs.writeUInt32BE(targetTransferTag, 20)
    bhs.writeUInt32BE(this.#cmdSN, 24)
    bhs.writeUInt32BE(this.#expStatSN, 28)
    await this.#send(assemblePdu(bhs, ping)).catch(error => log.debug('NOP reply failed', { error }))
  }

  #rejectAll(error: Error): void {
    if (this.#backlog.size > 0) {
      log.debug('rejecting all pending reads', { count: this.#backlog.size, error: error.message })
    }
    for (const [itt, pending] of this.#backlog) {
      this.#backlog.delete(itt)
      pending.reject(error)
    }
  }
}
