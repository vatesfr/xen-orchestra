import { createServer, type AddressInfo, type Server, type Socket } from 'node:net'
import { createLogger, type Logger } from '@xen-orchestra/log'

import type { BlockDevice } from './backend.mjs'
import { Connection, type ConnectionDeps } from './connection.mjs'
import type { ScsiIdentity } from './scsi.mjs'

export { FileBlockDevice } from './backend.mjs'
export type { BlockDevice, FileBlockDeviceOptions } from './backend.mjs'
export type { ScsiIdentity } from './scsi.mjs'

const log: Logger = createLogger('vates:iscsi')

const DEFAULT_PORT = 3260
const DEFAULT_WRITE_TIMEOUT_MS = 30_000
const DEFAULT_CMD_WINDOW = 64

const DEFAULT_IDENTITY: ScsiIdentity = {
  vendor: 'VATES',
  product: 'ISCSI LUN',
  revision: '0001',
  serial: '',
}

export interface IscsiTargetOptions {
  /** The target's iSCSI Qualified Name, e.g. `iqn.2024-01.tech.vates:lun0`. */
  readonly iqn: string
  /** The single LUN exposed by this target. */
  readonly lun: BlockDevice
  /** Listen address. Defaults to all interfaces. */
  readonly host?: string
  /** Listen port. Defaults to 3260. */
  readonly port?: number
  /** Overrides for the SCSI INQUIRY identity strings. */
  readonly identity?: Partial<ScsiIdentity>
  /** Drain timeout for outbound PDUs in ms (0 disables). Defaults to 30000. */
  readonly writeTimeoutMs?: number
  /** CmdSN command-window depth advertised to the initiator. Defaults to 64. */
  readonly cmdWindow?: number
}

/**
 * A minimal iSCSI target exposing exactly one read/write LUN.
 *
 * Single initiator, single connection (`MaxConnections=1`), `ErrorRecoveryLevel=0`,
 * no digests — the target drives negotiation onto one fixed code path. Concurrent
 * connections are refused; sequential ones (e.g. after a logout) are accepted.
 */
export class IscsiTarget {
  readonly #iqn: string
  readonly #lun: BlockDevice
  readonly #host?: string
  readonly #port: number
  readonly #identity: ScsiIdentity
  readonly #writeTimeoutMs: number
  readonly #cmdWindow: number

  #server?: Server
  #connection?: Connection
  #tsih = 0

  constructor(options: IscsiTargetOptions) {
    this.#iqn = options.iqn
    this.#lun = options.lun
    this.#host = options.host
    this.#port = options.port ?? DEFAULT_PORT
    this.#writeTimeoutMs = options.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT_MS
    this.#cmdWindow = options.cmdWindow ?? DEFAULT_CMD_WINDOW
    this.#identity = {
      ...DEFAULT_IDENTITY,
      // Default the serial to the IQN so the LUN has a stable, unique identity.
      serial: options.iqn,
      ...options.identity,
    }
  }

  #allocateTsih(): number {
    this.#tsih = (this.#tsih % 0xffff) + 1 // non-zero, wraps within 16 bits
    return this.#tsih
  }

  #deps(): ConnectionDeps {
    return {
      iqn: this.#iqn,
      identity: this.#identity,
      lun: this.#lun,
      writeTimeoutMs: this.#writeTimeoutMs,
      cmdWindow: this.#cmdWindow,
      allocateTsih: () => this.#allocateTsih(),
    }
  }

  #onConnection(socket: Socket): void {
    if (this.#connection !== undefined) {
      log.warn('refusing concurrent connection (MaxConnections=1)', { remote: socket.remoteAddress })
      socket.destroy()
      return
    }
    socket.setNoDelay(true)
    const connection = new Connection(socket, this.#deps())
    this.#connection = connection
    // Long-lived per-connection task; serve() handles its own errors and never
    // rejects, so detaching it here is safe.
    void connection.serve().finally(() => {
      if (this.#connection === connection) {
        this.#connection = undefined
      }
    })
  }

  /** Open the LUN (if needed) and start accepting connections. */
  async listen(): Promise<void> {
    if (this.#server !== undefined) {
      throw new Error('iSCSI target is already listening')
    }
    await this.#lun.open?.()

    const server = createServer(socket => this.#onConnection(socket))
    this.#server = server
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => reject(error)
        server.once('error', onError)
        server.listen(this.#port, this.#host, () => {
          server.removeListener('error', onError)
          resolve()
        })
      })
    } catch (error) {
      this.#server = undefined
      throw error
    }
    log.info('target listening', { iqn: this.#iqn, address: this.address() })
  }

  /** The bound address, or undefined if not listening on an IP socket. */
  address(): AddressInfo | undefined {
    const address = this.#server?.address()
    return address !== null && typeof address === 'object' ? address : undefined
  }

  /** Stop accepting connections, drop the active connection, and close the LUN. */
  async close(): Promise<void> {
    const server = this.#server
    const connection = this.#connection
    this.#server = undefined
    this.#connection = undefined
    if (server !== undefined) {
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
        // Drop the live connection so server.close() can complete.
        connection?.destroy()
      })
    }
    await this.#lun.close()
  }
}
