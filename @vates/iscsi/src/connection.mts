import type { Socket } from 'node:net'
import { createLogger, type Logger } from '@xen-orchestra/log'

import type { BlockDevice } from './backend.mjs'
import {
  Asc,
  DATA_IN_FLAG_FINAL,
  DATA_IN_FLAG_OVERFLOW,
  DATA_IN_FLAG_STATUS,
  DATA_IN_FLAG_UNDERFLOW,
  FLAG_FINAL,
  InitiatorOpcode,
  ISCSI_VERSION,
  LogoutResponse,
  RejectReason,
  RESERVED_TAG,
  SCSI_RESP_FLAG_OVERFLOW,
  SCSI_RESP_FLAG_UNDERFLOW,
  SCSI_RESPONSE_COMMAND_COMPLETED,
  ScsiStatus,
  SenseKey,
  TargetOpcode,
  TEXT_FLAG_FINAL,
} from './constants.mjs'
import { buildFixedSense, handleScsiCommand, type ScsiIdentity } from './scsi.mjs'
import { buildSendTargetsResponse, LoginNegotiator, parseTextKeys } from './login.mjs'
import { allocBhs, assemblePdu, type IncomingPdu, readPdu, writePdu } from './pdu.mjs'
import type { CommandContext, NegotiatedParams, ScsiResponseOptions, SessionType } from './types.mjs'
import { buildR2t, type PendingWrite } from './writePath.mjs'

const log: Logger = createLogger('vates:iscsi')

/** 2^32: the modulus for all iSCSI sequence-number arithmetic. */
export const SERIAL_MODULO = 0x1_0000_0000

/** Increment an iSCSI serial number with 32-bit wraparound. */
export function incrementSerial(value: number): number {
  return (value + 1) % SERIAL_MODULO
}

/** Add `delta` to an iSCSI serial number with 32-bit wraparound. */
export function addSerial(value: number, delta: number): number {
  return (value + delta) % SERIAL_MODULO
}

/** Everything a {@link Connection} needs from the owning target. */
export interface ConnectionDeps {
  readonly iqn: string
  readonly identity: ScsiIdentity
  readonly lun: BlockDevice
  /** Drain timeout for outbound PDUs, in ms (0 disables). */
  readonly writeTimeoutMs: number
  /** Size of the CmdSN command window advertised to the initiator. */
  readonly cmdWindow: number
  /** Allocate a fresh, non-zero Target Session Identifying Handle. */
  allocateTsih(): number
}

type Phase = 'login' | 'fullFeature' | 'closed'

/**
 * Drives one iSCSI connection: the login state machine, command-window /
 * StatSN sequencing, and dispatch of full-feature-phase PDUs. With
 * MaxConnections=1 a connection is also the whole session.
 *
 * Implements {@link CommandContext} (used by the SCSI layer) and constructs a
 * {@link WriteTransport} for the R2T/Data-Out write path. Commands are processed
 * one at a time — the read loop only advances once a command has fully
 * completed, which is why the write path can read its own Data-Out PDUs inline.
 */
export class Connection implements CommandContext {
  readonly #socket: Socket
  readonly #deps: ConnectionDeps
  readonly #login = new LoginNegotiator()

  #phase: Phase = 'login'
  #sessionType: SessionType = 'Normal'
  #params: NegotiatedParams = { initiatorMaxRecvDataSegmentLength: 8192, maxBurstLength: 262144 }

  #statSN = 0
  #expCmdSN = 0
  #maxCmdSN = 0
  #cmdSNInitialized = false
  #tsih = 0

  // In-progress WRITEs keyed by Initiator Task Tag. Data-Out PDUs are routed
  // here, so writes can be interleaved with (and outstanding alongside) other
  // commands without blocking the read loop.
  readonly #pendingWrites = new Map<number, PendingWrite>()
  #nextTargetTransferTag = 1

  constructor(socket: Socket, deps: ConnectionDeps) {
    this.#socket = socket
    this.#deps = deps
  }

  get lun(): BlockDevice {
    return this.#deps.lun
  }

  /** Forcibly tear down the connection (used when the target is closing). */
  destroy(): void {
    this.#phase = 'closed'
    this.#socket.destroy()
  }

  /** Read and service PDUs until the peer logs out or the connection drops. */
  async serve(): Promise<void> {
    try {
      for (;;) {
        const pdu = await readPdu(this.#socket)
        if (pdu === null) {
          break // peer closed the connection
        }
        const finished = await this.#dispatch(pdu)
        if (finished) {
          break
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const code = (err as NodeJS.ErrnoException).code
      // A peer dropping the socket (e.g. on logout) is normal, not a fault.
      if (code === 'ECONNRESET' || code === 'EPIPE' || code === 'ECONNABORTED') {
        log.debug('connection closed by peer', { code })
      } else {
        log.warn('connection error', err)
      }
    } finally {
      this.#phase = 'closed'
      this.#socket.destroy()
    }
  }

  // --- sequencing -----------------------------------------------------------

  /** Advance the command window from a freshly received PDU. */
  #updateCommandWindow(pdu: IncomingPdu): void {
    const cmdSN = pdu.cmdSN
    if (!this.#cmdSNInitialized) {
      this.#expCmdSN = cmdSN
      this.#cmdSNInitialized = true
    }
    // Immediate PDUs (Login, NOP pings, aborts) do not consume a CmdSN slot.
    if (!pdu.immediate) {
      this.#expCmdSN = incrementSerial(cmdSN)
    }
    this.#maxCmdSN = addSerial(this.#expCmdSN, this.#deps.cmdWindow)
  }

  /** Current StatSN without advancing (for R2T, NOP-In, Reject, non-final Data-In). */
  #currentStatSN(): number {
    return this.#statSN
  }

  /** Return the current StatSN and advance it (for status-bearing responses). */
  #nextStatSN(): number {
    const value = this.#statSN
    this.#statSN = incrementSerial(value)
    return value
  }

  #send(buffer: Buffer): Promise<void> {
    return writePdu(this.#socket, buffer, this.#deps.writeTimeoutMs)
  }

  // --- dispatch -------------------------------------------------------------

  /** Returns true when the connection should be closed (after a logout). */
  async #dispatch(pdu: IncomingPdu): Promise<boolean> {
    this.#updateCommandWindow(pdu)

    if (this.#phase === 'login') {
      if (pdu.opcode === InitiatorOpcode.LOGIN_REQUEST) {
        await this.#handleLogin(pdu)
      } else {
        await this.#sendReject(pdu, RejectReason.PROTOCOL_ERROR)
      }
      return false
    }

    switch (pdu.opcode) {
      case InitiatorOpcode.SCSI_COMMAND:
        if (this.#sessionType === 'Discovery') {
          await this.#sendReject(pdu, RejectReason.PROTOCOL_ERROR)
        } else {
          await this.#handleScsiCommand(pdu)
        }
        return false
      case InitiatorOpcode.TEXT_REQUEST:
        await this.#handleText(pdu)
        return false
      case InitiatorOpcode.NOP_OUT:
        await this.#handleNopOut(pdu)
        return false
      case InitiatorOpcode.LOGOUT_REQUEST:
        await this.#handleLogout(pdu)
        return true
      case InitiatorOpcode.SCSI_DATA_OUT:
        await this.#handleDataOut(pdu)
        return false
      default:
        await this.#sendReject(pdu, RejectReason.COMMAND_NOT_SUPPORTED)
        return false
    }
  }

  async #handleLogin(pdu: IncomingPdu): Promise<void> {
    const { flagsByte, data } = this.#login.process(pdu)
    if (this.#login.complete && this.#tsih === 0) {
      this.#tsih = this.#deps.allocateTsih()
    }

    const bhs = allocBhs(TargetOpcode.LOGIN_RESPONSE)
    bhs[1] = flagsByte
    bhs[2] = ISCSI_VERSION // Version-max
    bhs[3] = ISCSI_VERSION // Version-active
    pdu.bhs.copy(bhs, 8, 8, 14) // echo ISID (6 bytes)
    bhs.writeUInt16BE(this.#tsih, 14)
    bhs.writeUInt32BE(pdu.itt, 16)
    bhs.writeUInt32BE(this.#nextStatSN(), 24)
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    // Status-Class / Status-Detail (bytes 36-37) stay 0 = success.
    await this.#send(assemblePdu(bhs, data))

    if (this.#login.complete) {
      this.#phase = 'fullFeature'
      this.#sessionType = this.#login.sessionType
      this.#params = this.#login.params
      log.info('session established', {
        initiator: this.#login.initiatorName,
        sessionType: this.#sessionType,
        target: this.#login.targetName,
      })
    }
  }

  async #handleText(pdu: IncomingPdu): Promise<void> {
    const keys = parseTextKeys(pdu.data)
    // SendTargets discovery: advertise this target at the address the initiator
    // actually connected to.
    const data =
      keys.get('SendTargets') !== undefined
        ? buildSendTargetsResponse(
            this.#deps.iqn,
            this.#socket.localAddress ?? '0.0.0.0',
            this.#socket.localPort ?? 3260
          )
        : Buffer.alloc(0)

    const bhs = allocBhs(TargetOpcode.TEXT_RESPONSE)
    bhs[1] = TEXT_FLAG_FINAL
    bhs.writeUInt32BE(pdu.itt, 16)
    bhs.writeUInt32BE(RESERVED_TAG, 20) // Target Transfer Tag: none / final
    bhs.writeUInt32BE(this.#nextStatSN(), 24)
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    await this.#send(assemblePdu(bhs, data))
  }

  async #handleNopOut(pdu: IncomingPdu): Promise<void> {
    // A NOP-Out with the reserved ITT is the initiator's reply to a NOP-In we
    // sent; nothing to do. Otherwise echo it back as a NOP-In ping reply.
    if (pdu.itt === RESERVED_TAG) {
      return
    }
    const bhs = allocBhs(TargetOpcode.NOP_IN)
    bhs[1] = FLAG_FINAL
    pdu.bhs.copy(bhs, 8, 8, 16) // echo LUN
    bhs.writeUInt32BE(pdu.itt, 16)
    bhs.writeUInt32BE(RESERVED_TAG, 20) // Target Transfer Tag
    bhs.writeUInt32BE(this.#currentStatSN(), 24) // NOP-In does not advance StatSN
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    await this.#send(assemblePdu(bhs, pdu.data)) // echo ping data
  }

  async #handleLogout(pdu: IncomingPdu): Promise<void> {
    const bhs = allocBhs(TargetOpcode.LOGOUT_RESPONSE)
    bhs[1] = FLAG_FINAL
    bhs[2] = LogoutResponse.SUCCESS
    bhs.writeUInt32BE(pdu.itt, 16)
    bhs.writeUInt32BE(this.#nextStatSN(), 24)
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    await this.#send(assemblePdu(bhs))
  }

  async #handleScsiCommand(pdu: IncomingPdu): Promise<void> {
    const cdb = pdu.bhs.subarray(32, 48)
    await handleScsiCommand(cdb, pdu.itt, this, this.#deps.identity)
  }

  async #sendReject(pdu: IncomingPdu, reason: number): Promise<void> {
    const bhs = allocBhs(TargetOpcode.REJECT)
    bhs[1] = FLAG_FINAL
    bhs[2] = reason
    bhs.writeUInt32BE(RESERVED_TAG, 16)
    bhs.writeUInt32BE(this.#currentStatSN(), 24) // Reject snapshots StatSN
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    // The rejected PDU's header is returned as the data segment.
    await this.#send(assemblePdu(bhs, pdu.bhs))
  }

  // --- CommandContext implementation ----------------------------------------

  async sendReadData(itt: number, data: Buffer, allocationLength: number): Promise<void> {
    let payload = data
    let residualOverflow = 0
    let residualUnderflow = 0
    if (data.length > allocationLength) {
      payload = data.subarray(0, allocationLength)
      residualOverflow = data.length - allocationLength
    } else if (data.length < allocationLength) {
      residualUnderflow = allocationLength - data.length
    }

    if (payload.length === 0) {
      return this.sendScsiResponse(itt, ScsiStatus.GOOD, { residualOverflow, residualUnderflow })
    }

    const maxSegment = this.#params.initiatorMaxRecvDataSegmentLength
    let offset = 0
    let dataSN = 0
    while (offset < payload.length) {
      const end = Math.min(offset + maxSegment, payload.length)
      const chunk = payload.subarray(offset, end)
      const isLast = end >= payload.length

      const bhs = allocBhs(TargetOpcode.SCSI_DATA_IN)
      let flags = 0
      if (isLast) {
        // Piggyback GOOD status on the final Data-In PDU.
        flags |= DATA_IN_FLAG_FINAL | DATA_IN_FLAG_STATUS
        if (residualOverflow > 0) {
          flags |= DATA_IN_FLAG_OVERFLOW
        }
        if (residualUnderflow > 0) {
          flags |= DATA_IN_FLAG_UNDERFLOW
        }
        bhs[3] = ScsiStatus.GOOD // Status valid only when the S bit is set
      }
      bhs[1] = flags
      bhs.writeUInt32BE(itt, 16)
      bhs.writeUInt32BE(RESERVED_TAG, 20) // Target Transfer Tag
      if (isLast) {
        bhs.writeUInt32BE(this.#nextStatSN(), 24) // StatSN valid only with the S bit
      }
      bhs.writeUInt32BE(this.#expCmdSN, 28)
      bhs.writeUInt32BE(this.#maxCmdSN, 32)
      bhs.writeUInt32BE(dataSN, 36)
      bhs.writeUInt32BE(offset, 40) // Buffer Offset
      if (isLast) {
        bhs.writeUInt32BE(residualOverflow || residualUnderflow, 44)
      }
      await this.#send(assemblePdu(bhs, chunk))

      offset = end
      dataSN++
    }
  }

  async beginWrite(itt: number, lunOffset: number, totalLength: number): Promise<void> {
    const pending: PendingWrite = {
      itt,
      targetTransferTag: this.#nextTargetTransferTag++,
      lunOffset,
      buffer: Buffer.allocUnsafe(totalLength),
      totalLength,
      received: 0,
      solicited: 0,
      r2tSN: 0,
    }
    this.#pendingWrites.set(itt, pending)
    await this.#sendNextR2t(pending)
  }

  /** Solicit the next burst (≤ MaxBurstLength) of a pending write via an R2T. */
  async #sendNextR2t(pending: PendingWrite): Promise<void> {
    const desiredLength = Math.min(pending.totalLength - pending.solicited, this.#params.maxBurstLength)
    const bufferOffset = pending.solicited
    const r2tSN = pending.r2tSN
    pending.solicited += desiredLength
    pending.r2tSN++
    await this.#send(
      buildR2t(
        { itt: pending.itt, r2tSN, targetTransferTag: pending.targetTransferTag, bufferOffset, desiredLength },
        { statSN: this.#currentStatSN(), expCmdSN: this.#expCmdSN, maxCmdSN: this.#maxCmdSN }
      )
    )
  }

  async #handleDataOut(pdu: IncomingPdu): Promise<void> {
    const pending = this.#pendingWrites.get(pdu.itt)
    if (pending === undefined) {
      // Data-Out for an unknown command: protocol desync.
      await this.#sendReject(pdu, RejectReason.PROTOCOL_ERROR)
      return
    }
    pdu.data.copy(pending.buffer, pdu.readU32(40)) // BufferOffset is absolute
    pending.received += pdu.data.length

    if (pending.received >= pending.totalLength) {
      this.#pendingWrites.delete(pdu.itt)
      try {
        await this.lun.write(pending.lunOffset, pending.buffer)
      } catch (error) {
        log.warn('LUN write failed', error instanceof Error ? error : new Error(String(error)))
        const sense = buildFixedSense({ key: SenseKey.MEDIUM_ERROR, ...Asc.NO_ADDITIONAL_SENSE })
        await this.sendScsiResponse(pending.itt, ScsiStatus.CHECK_CONDITION, { sense })
        return
      }
      await this.sendScsiResponse(pending.itt, ScsiStatus.GOOD)
    } else if (pending.received >= pending.solicited) {
      // Current burst complete and data remains: solicit the next one.
      await this.#sendNextR2t(pending)
    }
  }

  async sendScsiResponse(itt: number, status: number, options: ScsiResponseOptions = {}): Promise<void> {
    const { sense, residualOverflow = 0, residualUnderflow = 0 } = options

    const bhs = allocBhs(TargetOpcode.SCSI_RESPONSE)
    let flags = FLAG_FINAL // bit 7 is always set on a SCSI Response
    if (residualOverflow > 0) {
      flags |= SCSI_RESP_FLAG_OVERFLOW
    }
    if (residualUnderflow > 0) {
      flags |= SCSI_RESP_FLAG_UNDERFLOW
    }
    bhs[1] = flags
    bhs[2] = SCSI_RESPONSE_COMMAND_COMPLETED
    bhs[3] = status
    bhs.writeUInt32BE(itt, 16)
    bhs.writeUInt32BE(this.#nextStatSN(), 24)
    bhs.writeUInt32BE(this.#expCmdSN, 28)
    bhs.writeUInt32BE(this.#maxCmdSN, 32)
    bhs.writeUInt32BE(residualOverflow || residualUnderflow, 44)

    let data: Buffer | undefined
    if (sense !== undefined) {
      // Sense data in a SCSI Response is prefixed with a 2-byte length.
      data = Buffer.alloc(2 + sense.length)
      data.writeUInt16BE(sense.length, 0)
      sense.copy(data, 2)
    }
    await this.#send(assemblePdu(bhs, data))
  }
}
