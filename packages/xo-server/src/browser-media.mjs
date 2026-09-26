import { BrowserMediaRecovery } from './browser-media-recovery.mjs'
import { createLogger } from '@xen-orchestra/log'
import { forbiddenOperation, invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { createBrowserMediaTarget } from './browser-media-iscsi.mjs'
import { registerBrowserMediaRest } from './browser-media-rest.mjs'
import { randomBytes } from 'node:crypto'
import WebSocket, { WebSocketServer } from 'ws'

const log = createLogger('xo:browser-media')
const PREFIX = '/api/browser-media/'
const token = () => randomBytes(32).toString('hex')

const SECTOR_SIZE = 512
const MIN_ISO_SIZE = 32 * 1024
const MAX_ISO_SIZE = 128 * 1024 ** 3
const MAX_SESSIONS = 16
// per browser request, and requests pending per session
const MAX_READ = 1024 * 1024
const MAX_PENDING_READS = 16
const MAX_HEARTBEAT_INTERVAL = 15e3
const STOP_CLEANUP_TIMEOUT = 10e3

/**
 * Only host names are compared: a reverse proxy may drop the port from `Host`
 * (e.g. nginx `proxy_set_header Host $host`) while `Origin` keeps it.
 *
 * A request without `Origin` does not come from a browser page, the one-use
 * path is then the only credential.
 */
function isSameOrigin({ headers: { host, origin } }) {
  if (origin === undefined) return true
  try {
    return new URL(origin).hostname === new URL(`http://${host}`).hostname
  } catch {
    return false
  }
}

/**
 * The browser side of a session is handled here, its storage side by
 * `browser-media-attach.mjs`, which sets the optional fields once attaching.
 *
 * @typedef {object} BrowserMediaSession
 * @property {string} id identifies the session in the REST API
 * @property {string} browserToken one-use WebSocket path, only given to the owner
 * @property {string} owner id of the user who created the session
 * @property {string} vm id of the VM
 * @property {string} name ISO file name
 * @property {number} size ISO size, in bytes
 * @property {boolean} closed the browser is gone, the storage may still be being released
 * @property {number} expires heartbeat deadline, as a timestamp
 * @property {Map<number, { length: number, resolve: Function, reject: Function }>} pending browser reads in flight
 * @property {number} nextId id of the next browser read
 * @property {WebSocket} [socket] set once the browser is connected
 * @property {Promise<{ vdi: string }>} [operation] the attachment, once started
 * @property {() => Promise<void>} [cleanup] releases the storage, can be retried
 * @property {() => void} [onClose] called once the browser is gone
 * @property {ReturnType<typeof setInterval>} [monitor] detects an ISO ejected by another client
 * @property {ReturnType<typeof setTimeout>} [cleanupTimer] next cleanup retry
 */

export class BrowserMedia {
  sessions = new Map()
  targets = new Set()
  createTarget = session => createBrowserMediaTarget(this, session)

  constructor({ timeout = 30000 } = {}) {
    this.timeout = timeout
    this.webSockets = new WebSocketServer({ noServer: true, maxPayload: MAX_READ + 4, perMessageDeflate: false })
    this.timer = setInterval(
      () => {
        for (const session of this.sessions.values()) {
          if (session.expires < Date.now()) this.close(session)
          else if (session.socket !== undefined) session.socket.ping()
        }
      },
      Math.min(timeout, MAX_HEARTBEAT_INTERVAL)
    ).unref()
  }

  /** @returns {BrowserMediaSession} */
  create({ owner, vm, name, size }) {
    if (!Number.isSafeInteger(size) || size < MIN_ISO_SIZE || size % SECTOR_SIZE !== 0 || size > MAX_ISO_SIZE) {
      throw invalidParameters('the ISO size must be a multiple of 512 bytes, between 32 KiB and 128 GiB')
    }
    if (this.stopping) throw forbiddenOperation('create browser media', 'xo-server is stopping')
    // includes sessions whose storage is still being cleaned up
    if ([...this.sessions.values()].some(session => session.vm === vm)) {
      throw objectAlreadyExists({ objectId: vm, objectType: 'browser media for this VM' })
    }
    if (this.sessions.size >= MAX_SESSIONS) throw forbiddenOperation('create browser media', 'too many sessions')
    const session = {
      id: token(),
      browserToken: token(),
      owner,
      vm,
      name,
      size,
      pending: new Map(),
      nextId: 0,
      expires: Date.now() + this.timeout,
      closed: false,
    }
    this.sessions.set(session.id, session)
    return session
  }

  /** @returns {BrowserMediaSession} */
  get(id, owner, allowClosed = false) {
    const session = this.sessions.get(id)
    // another user's session is reported as missing, not forbidden
    if (session === undefined || session.owner !== owner || (session.closed && !allowClosed))
      throw noSuchObject(id, 'browser-media')
    return session
  }

  close(session) {
    if (session.closed) return
    session.closed = true
    if (session.onClose === undefined) this.release(session)
    session.socket?.terminate()
    for (const pending of session.pending.values()) pending.reject(new Error('Media disconnected'))
    session.pending.clear()
    // The attachment layer owns asynchronous XAPI cleanup and retries.
    session.onClose?.()
  }

  upgrade(req, socket, head) {
    if (!req.url.startsWith(PREFIX)) return
    const session = [...this.sessions.values()].find(
      candidate => req.url === `${PREFIX}${candidate.browserToken}/socket`
    )
    // the path can be used once, and only from XO's own pages
    if (session === undefined || session.closed || session.socket !== undefined || !isSameOrigin(req)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
      return
    }
    this.webSockets.handleUpgrade(req, socket, head, ws => {
      session.socket = ws
      session.expires = Date.now() + this.timeout
      ws.on('pong', () => {
        session.expires = Date.now() + this.timeout
      })
      ws.on('error', () => this.close(session))
      ws.on('close', () => this.close(session))
      ws.on('message', (data, binary) => {
        if (!binary || data.length < 4) return this.close(session)
        const id = data.readUInt32BE(0)
        const pending = session.pending.get(id)
        if (pending === undefined || data.length !== pending.length + 4) return this.close(session)
        pending.resolve(data.subarray(4))
      })
      ws.send(JSON.stringify({ ready: true }))
    })
  }

  read(session, offset, length) {
    if (session.closed || session.socket?.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Media disconnected'))
    }
    if (session.pending.size >= MAX_PENDING_READS) return Promise.reject(new Error('Too many outstanding reads'))
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isInteger(length) ||
      offset < 0 ||
      length < 1 ||
      length > MAX_READ ||
      offset + length > session.size
    )
      return Promise.reject(new Error('Invalid read'))
    const id = session.nextId++ >>> 0
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.close(session), this.timeout)
      const finish = fn => value => {
        clearTimeout(timer)
        session.pending.delete(id)
        fn(value)
      }
      session.pending.set(id, { length, resolve: finish(resolve), reject: finish(reject) })
      session.socket.send(JSON.stringify({ id, offset, length }), error => {
        if (error) this.close(session)
      })
    })
  }

  release(session) {
    clearTimeout(session.cleanupTimer)
    this.sessions.delete(session.id)
  }

  async stop() {
    this.stopping = true
    clearInterval(this.timer)
    for (const session of this.sessions.values()) this.close(session)
    this.webSockets.close()
    const cleanup = Promise.all(
      [...this.sessions.values()].map(async session => {
        clearTimeout(session.cleanupTimer)
        // a failed attachment was already reported to its caller
        await session.operation?.catch(() => {})
        // left to the recovery on next start
        await session.cleanup?.().catch(error => log.warn('could not release browser media on stop', { error }))
      })
    )
    let timer
    await Promise.race([cleanup, new Promise(resolve => (timer = setTimeout(resolve, STOP_CLEANUP_TIMEOUT)))])
    clearTimeout(timer)
    await Promise.allSettled([...this.targets].map(target => target.close()))
    this.targets.clear()
  }
}

export function installBrowserMedia(webServer, xo) {
  // Unlike live mount, the address reachable from the hosts is not detected
  // yet: without it, the feature is not installed.
  const advertisedAddress = xo.config.getOptional('iscsi.advertisedAddress')
  if (typeof advertisedAddress !== 'string' || advertisedAddress.length === 0) return
  const media = new BrowserMedia()
  media.advertisedAddress = advertisedAddress
  media.bindAddress = xo.config.getOptional('iscsi.bindAddress')
  media.recovery = new BrowserMediaRecovery(xo, media)
  const reconcile = () =>
    media.recovery.reconcile().catch(error => log.warn('browser media recovery failed', { error }))
  // Installation runs after the initial server connections; handle those now,
  // as well as reconnects and hosts returning after a temporary outage.
  const recoveryTimer = setInterval(reconcile, 30000).unref()
  xo.on('server:connected', reconcile)
  // Storage timeouts must not delay HTTP/API startup.
  reconcile()
  xo.hooks.on('stop', () => {
    clearInterval(recoveryTimer)
    xo.removeListener('server:connected', reconcile)
  })
  const unregisterRest = registerBrowserMediaRest(xo, media)
  xo.hooks.on('stop', unregisterRest)
  webServer.on('upgrade', (req, socket, head) => media.upgrade(req, socket, head))
  xo.hooks.on('stop', () => media.stop())
}
