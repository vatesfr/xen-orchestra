import { createServer, type AddressInfo, type Server, type Socket } from 'node:net'
import { createLogger, type Logger } from '@xen-orchestra/log'

import type { BlockDevice } from './backend.mjs'
import { Connection, type ConnectionDeps } from './connection.mjs'
import type { ScsiIdentity } from './scsi.mjs'
import type { ChapCredentials } from './types.mjs'

export { FileBlockDevice } from './backend.mjs'
export type { BlockDevice, FileBlockDeviceOptions } from './backend.mjs'
export type { ScsiIdentity } from './scsi.mjs'
export type { ChapCredentials } from './types.mjs'
export { IscsiInitiator } from './initiator.mjs'
export type { IscsiInitiatorOptions } from './initiator.mjs'
export { IscsiDisk } from './IscsiDisk.mjs'
export type { IscsiDiskOptions } from './IscsiDisk.mjs'
export { DiskBlockDevice } from './DiskBlockDevice.mjs'
export type { DiskBlockDeviceOptions } from './DiskBlockDevice.mjs'
export { CachedDiskBlockDevice } from './CachedDiskBlockDevice.mjs'
export type { CachedDiskBlockDeviceOptions } from './CachedDiskBlockDevice.mjs'

const log: Logger = createLogger('vates:iscsi')

const DEFAULT_PORT = 3260
const DEFAULT_WRITE_TIMEOUT_MS = 30_000
const DEFAULT_CMD_WINDOW = 64
const DEFAULT_READ_CONCURRENCY = 16
const DEFAULT_LOGIN_TIMEOUT_MS = 15_000
const DEFAULT_MAX_PENDING_CONNECTIONS = 8

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
  /**
   * Max number of READ commands served concurrently — the command window lets
   * the initiator keep many outstanding, but this caps how many `lun.read()`
   * calls actually run at once regardless (e.g. so a deep queue depth doesn't
   * fire dozens of simultaneous fetches against a real backend). Defaults to 16.
   */
  readonly readConcurrency?: number
  /**
   * When set, require one-way CHAP: the target challenges each initiator and
   * rejects the login unless it proves this credential (interop with the
   * open-iscsi `node.session.auth` username/password). Omit for no authentication.
   */
  readonly chap?: ChapCredentials
  /**
   * Time a new connection has to establish a Normal session, in ms (0
   * disables). Also bounds Discovery sessions. Defaults to 15000.
   */
  readonly loginTimeoutMs?: number
  /**
   * Max number of connections that have not established a Normal session yet;
   * past it, the oldest one is dropped. Defaults to 8.
   */
  readonly maxPendingConnections?: number
}

/**
 * A minimal iSCSI target exposing exactly one read/write LUN.
 *
 * Single initiator, single connection (`MaxConnections=1`),
 * `ErrorRecoveryLevel=0`, no digests.
 *
 * A new connection replaces the current one rather than being refused (see
 * `#onSessionEstablished`): there is no way to tell a stale, abandoned
 * connection (initiator gave up without closing the socket) from a healthy
 * one, so refusing would let one stuck connection wedge the target forever.
 * The replacement only happens once the new connection has established a
 * Normal session, CHAP included when configured, so that a port scan, a failed
 * login or a Discovery session cannot interrupt the current one. Until then,
 * connections are bounded in time (`loginTimeoutMs`) and in number
 * (`maxPendingConnections`). Not RFC 7143 session reinstatement (no ISID
 * matching) — safe here since the target is ephemeral, CHAP-guarded, and
 * single-consumer.
 */
export class IscsiTarget {
  readonly #iqn: string
  readonly #lun: BlockDevice
  readonly #host?: string
  readonly #port: number
  readonly #identity: ScsiIdentity
  readonly #writeTimeoutMs: number
  readonly #cmdWindow: number
  readonly #readConcurrency: number
  readonly #chap?: ChapCredentials
  readonly #loginTimeoutMs: number
  readonly #maxPendingConnections: number

  #server?: Server
  // the connection with an established Normal session, serving the LUN
  #connection?: Connection
  // connections without one yet, in arrival order
  readonly #pendingConnections = new Set<Connection>()
  #tsih = 0

  constructor(options: IscsiTargetOptions) {
    this.#iqn = options.iqn
    this.#lun = options.lun
    this.#host = options.host
    this.#port = options.port ?? DEFAULT_PORT
    this.#writeTimeoutMs = options.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT_MS
    this.#cmdWindow = options.cmdWindow ?? DEFAULT_CMD_WINDOW
    this.#readConcurrency = options.readConcurrency ?? DEFAULT_READ_CONCURRENCY
    this.#chap = options.chap
    this.#loginTimeoutMs = options.loginTimeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS
    this.#maxPendingConnections = options.maxPendingConnections ?? DEFAULT_MAX_PENDING_CONNECTIONS
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
      readConcurrency: this.#readConcurrency,
      allocateTsih: () => this.#allocateTsih(),
      chap: this.#chap,
      loginTimeoutMs: this.#loginTimeoutMs,
      onSessionEstablished: connection => this.#onSessionEstablished(connection),
    }
  }

  #onConnection(socket: Socket): void {
    const pending = this.#pendingConnections
    if (pending.size >= this.#maxPendingConnections) {
      // a Set iterates in insertion order: this is the oldest
      const [oldest] = pending
      log.warn('too many connections without a session, dropping the oldest', { remote: socket.remoteAddress })
      pending.delete(oldest)
      oldest.destroy()
    }
    socket.setNoDelay(true)
    const connection = new Connection(socket, this.#deps())
    pending.add(connection)
    // Long-lived per-connection task; serve() handles its own errors and never
    // rejects, so detaching it here is safe.
    void connection.serve().finally(() => {
      pending.delete(connection)
      if (this.#connection === connection) {
        this.#connection = undefined
      }
    })
  }

  #onSessionEstablished(connection: Connection): void {
    this.#pendingConnections.delete(connection)
    const existing = this.#connection
    if (existing !== undefined) {
      // Replaces a possibly-stale connection rather than refusing; see the class doc.
      log.warn('replacing existing connection with a newly logged in one')
      existing.destroy()
    }
    this.#connection = connection
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

  /** Stop accepting connections, drop every connection, and close the LUN. */
  async close(): Promise<void> {
    const server = this.#server
    const connections = [...this.#pendingConnections]
    if (this.#connection !== undefined) {
      connections.push(this.#connection)
    }
    this.#server = undefined
    this.#connection = undefined
    this.#pendingConnections.clear()
    if (server !== undefined) {
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
        // Drop the live connections so server.close() can complete.
        for (const connection of connections) {
          connection.destroy()
        }
      })
    }
    await this.#lun.close()
  }
}
