import { randomBytes } from 'node:crypto'
import WebSocket from 'ws'

const SECTOR_SIZE = 512
export const MIN_ISO_SIZE = 32 * 1024
export const MAX_ISO_SIZE = 128 * 1024 ** 3
export const MAX_NAME_LENGTH = 255

// per browser read: the LUN advertises it as its max transfer length, so a read
// never has to be split
export const MAX_READ = 1024 * 1024
const MAX_PENDING_READS = 16

// close codes sent to the browser, in the range reserved to applications
export const CLOSE_INVALID = 4400
export const CLOSE_EJECTED = 4410
export const CLOSE_IDLE = 4408
export const CLOSE_UNAVAILABLE = 4503

/**
 * What an insertion changed so far, undone when the session is released.
 *
 * @typedef {object} Insertion
 * @property {string} pool - uuid of the pool of the VM
 * @property {string} vmUuid
 * @property {boolean} [journaled] - the session is in the journal
 * @property {boolean} [blocked] - operations of the VM are blocked for the session
 * @property {string} [mountId] - id of the live mount serving the ISO, while it is mounted
 * @property {boolean} [mounted] - the ISO was mounted, even if the mount has ended since
 * @property {string} [vdiRef] - opaque ref of the VDI of the ISO
 * @property {string} [vbdRef] - opaque ref of the CD drive the ISO is inserted in
 */

/**
 * Validate the first message of the browser, which describes its ISO.
 *
 * @returns {{ name: string, size: number } | string} the ISO, or why it is refused
 */
export function parseIsoDescription(data, binary) {
  if (binary) {
    return 'the first message must describe the ISO'
  }
  let message
  try {
    message = JSON.parse(data.toString())
  } catch {
    return 'the first message must be JSON'
  }
  const { name, size } = message ?? {}
  if (typeof name !== 'string' || name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return `the ISO name must be between 1 and ${MAX_NAME_LENGTH} characters`
  }
  if (!Number.isSafeInteger(size) || size < MIN_ISO_SIZE || size > MAX_ISO_SIZE || size % SECTOR_SIZE !== 0) {
    return 'the ISO size must be a multiple of 512 bytes, between 32 KiB and 128 GiB'
  }
  return { name, size }
}

/**
 * The browser side of a session: an ISO it serves over a WebSocket.
 *
 * Once the browser has described its ISO, it receives `{"session": id}`, then
 * read requests `{"id", "offset", "length"}`, each answered by a binary message:
 * `id` as a big-endian uint32, followed by exactly `length` bytes of the ISO.
 *
 * Any protocol violation, pending reads without any reply for `timeout`, a read
 * pending for longer than all the reads the browser can be asked at once take
 * at that pace (`MAX_PENDING_READS` × `timeout`), or a heartbeat missed for
 * `timeout`, closes the session: reads then fail, and the guest gets I/O errors,
 * never wrong data.
 */
export class BrowserMediaSession {
  id = randomBytes(16).toString('hex')
  bytesRead = 0
  closed = false
  createdAt = Date.now()
  /**
   * `inserting` while the insertion runs, `ejecting` while an insertion, even a failed one, is undone
   *
   * @type {'connected' | 'inserting' | 'inserted' | 'ejecting'}
   */
  status = 'connected'

  /** @type {string | undefined} */
  error
  /** @type {number | undefined} */
  insertedAt
  /** @type {number | undefined} */
  lastReadAt
  /** @type {string | undefined} id of the VM, from the start of the insertion */
  vmId
  /** @type {string | undefined} uuid of the inserted VDI */
  vdiUuid

  /** @type {Insertion | undefined} what the insertion changed, until it is undone */
  insertion
  /** @type {Promise<{ vdiId: string }> | undefined} the insertion in progress */
  insertingPromise
  /** @type {Promise<void> | undefined} the attempt to undo the insertion in progress */
  releasingPromise
  /** @type {Promise<void> | undefined} the retries of a failed release, in progress */
  retryingReleasePromise
  /** whether the retries of a failed release are over: it is then only retried quietly */
  releaseGivenUp = false

  #nextId = 0
  #pending = new Map()
  #expires
  // armed while reads are pending, re-armed by each reply
  #stallTimer
  #onClose
  #socket
  #timeout

  /**
   * @param {object} params
   * @param {WebSocket} params.socket
   * @param {string} params.userId - id of the user whose browser serves the ISO
   * @param {string} params.name
   * @param {number} params.size
   * @param {number} params.timeout - for a read, and between heartbeats
   * @param {(session: BrowserMediaSession) => void} params.onClose
   */
  constructor({ socket, userId, name, size, timeout, onClose }) {
    this.userId = userId
    this.name = name
    this.size = size
    this.#onClose = onClose
    this.#socket = socket
    this.#timeout = timeout
    this.#expires = Date.now() + timeout

    socket.on('pong', () => {
      this.#expires = Date.now() + this.#timeout
    })
    socket.on('error', () => this.close())
    socket.on('close', () => this.close())
    socket.on('message', (data, binary) => this.#onMessage(data, binary))
    socket.send(JSON.stringify({ session: this.id }))
  }

  #onMessage(data, binary) {
    if (!binary || data.length < 4) {
      return this.close(CLOSE_INVALID, 'expected a binary reply')
    }
    const id = data.readUInt32BE(0)
    const pending = this.#pending.get(id)
    if (pending === undefined || data.length !== pending.length + 4) {
      return this.close(CLOSE_INVALID, 'unexpected reply')
    }
    this.bytesRead += pending.length
    this.lastReadAt = Date.now()
    pending.resolve(data.subarray(4))
    // the browser is making progress: on a slow link, the last of the concurrent reads may be
    // answered long after it was requested
    this.#clearStallTimer()
    if (this.#pending.size !== 0) {
      this.#armStallTimer()
    }
  }

  // until `timeout` from now, or until the oldest pending read has waited too long: a browser
  // answering the other reads must not leave one unanswered forever
  #armStallTimer() {
    const oldest = this.#pending.values().next().value
    const delay = Math.min(this.#timeout, oldest.requestedAt + MAX_PENDING_READS * this.#timeout - Date.now())
    this.#stallTimer = setTimeout(() => this.close(), Math.max(0, delay))
  }

  #clearStallTimer() {
    clearTimeout(this.#stallTimer)
    this.#stallTimer = undefined
  }

  /** Ping the browser, or close the session if it missed the previous heartbeats. */
  heartbeat() {
    if (this.#expires < Date.now()) {
      this.close()
    } else if (this.#socket.readyState === WebSocket.OPEN) {
      this.#socket.ping()
    }
  }

  /**
   * @param {number} offset
   * @param {number} length
   * @returns {Promise<Buffer>}
   */
  read(offset, length) {
    if (this.closed || this.#socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('the browser serving this ISO is disconnected'))
    }
    if (this.#pending.size >= MAX_PENDING_READS) {
      return Promise.reject(new Error('too many reads pending on the browser'))
    }
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 1 ||
      length > MAX_READ ||
      offset + length > this.size
    ) {
      return Promise.reject(new Error('invalid read'))
    }
    const id = this.#nextId
    this.#nextId = (this.#nextId + 1) >>> 0
    return new Promise((resolve, reject) => {
      const settle = fn => value => {
        this.#pending.delete(id)
        fn(value)
      }
      this.#pending.set(id, { length, requestedAt: Date.now(), resolve: settle(resolve), reject: settle(reject) })
      // reads left unanswered mean the browser is stuck: the guest must not wait on it. A new read
      // does not extend the wait of the pending ones
      if (this.#stallTimer === undefined) {
        this.#armStallTimer()
      }
      this.#socket.send(JSON.stringify({ id, offset, length }), error => {
        if (error) {
          this.close()
        }
      })
    })
  }

  /**
   * Disconnect the browser: the pending and future reads fail.
   *
   * @param {number} [code] - close code sent to the browser
   * @param {string} [reason]
   */
  close(code, reason) {
    if (this.closed) {
      return
    }
    this.closed = true
    this.#clearStallTimer()
    if (code === undefined) {
      this.#socket.terminate()
    } else {
      this.#socket.close(code, reason)
    }
    for (const pending of this.#pending.values()) {
      pending.reject(new Error('the browser serving this ISO is disconnected'))
    }
    this.#pending.clear()
    this.#onClose(this)
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      size: this.size,
      userId: this.userId,
      status: this.status,
      createdAt: this.createdAt,
      bytesRead: this.bytesRead,
      lastReadAt: this.lastReadAt,
      vmId: this.vmId,
      vdiId: this.vdiUuid,
      insertedAt: this.insertedAt,
      error: this.error,
    }
  }
}
