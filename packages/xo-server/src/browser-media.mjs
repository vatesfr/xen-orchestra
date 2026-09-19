import { BrowserMediaRecovery } from './browser-media-recovery.mjs'
import { createLogger } from '@xen-orchestra/log'
import { createBrowserMediaTarget } from './browser-media-iscsi.mjs'
import { registerBrowserMediaRest } from './browser-media-rest.mjs'
import { randomBytes } from 'node:crypto'
import { WebSocketServer } from 'ws'

const log = createLogger('xo:browser-media')
const PREFIX = '/api/browser-media/'
const MAX_READ = 1024 * 1024
const token = () => randomBytes(32).toString('hex')

// Only the authenticated session owner receives the one-use producer capability.
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
      Math.min(timeout, 15000)
    ).unref()
  }

  create({ owner, vm, name, size }) {
    if (!Number.isSafeInteger(size) || size < 32768 || size % 512 !== 0 || size > 128 * 1024 ** 3) {
      throw new Error('Select a sector-aligned ISO between 32 KiB and 128 GiB')
    }
    if (this.stopping) throw new Error('Browser media is stopping')
    if ([...this.sessions.values()].some(session => session.vm === vm)) {
      throw new Error('This VM already has a local ISO session or pending cleanup')
    }
    if (this.sessions.size >= 16) throw new Error('Too many virtual media sessions')
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

  get(id, owner, allowClosed = false) {
    const session = this.sessions.get(id)
    if (session === undefined || session.owner !== owner || (session.closed && !allowClosed))
      throw new Error('Media session unavailable')
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
    const session = [...this.sessions.values()].find(s => req.url === `${PREFIX}${s.browserToken}/socket`)
    // Browser capability is one-use; reject cross-origin browser upgrades too.
    let sameOrigin = true
    try {
      sameOrigin = req.headers.origin === undefined || new URL(req.headers.origin).host === req.headers.host
    } catch (_) {
      sameOrigin = false
    }
    if (session === undefined || session.closed || session.socket !== undefined || !sameOrigin) {
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
    if (session.closed || session.socket?.readyState !== 1) return Promise.reject(new Error('Media disconnected'))
    if (session.pending.size >= 16) return Promise.reject(new Error('Too many outstanding reads'))
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
    const cleanup = Promise.allSettled(
      [...this.sessions.values()].map(async session => {
        clearTimeout(session.cleanupTimer)
        await session.operation?.catch(() => {})
        await session.cleanup?.()
      })
    )
    let timer
    await Promise.race([cleanup, new Promise(resolve => (timer = setTimeout(resolve, 10000)))])
    clearTimeout(timer)
    await Promise.allSettled([...this.targets].map(target => target.close()))
    this.targets.clear()
  }
}

export async function installBrowserMedia(webServer, xo) {
  if (process.env.XO_BROWSER_MEDIA_ENABLED !== '1') return
  const advertisedAddress = xo.config.getOptional('iscsi.advertisedAddress')
  if (typeof advertisedAddress !== 'string' || advertisedAddress.length === 0) {
    throw new Error('Browser media requires iscsi.advertisedAddress reachable from the XCP-ng hosts')
  }
  const media = new BrowserMedia()
  media.advertisedAddress = advertisedAddress
  media.bindAddress = xo.config.getOptional('iscsi.bindAddress')
  media.recovery = new BrowserMediaRecovery(xo, media)
  const reconcile = () =>
    media.recovery.reconcile().catch(error => log.warn('browser media recovery failed', { error }))
  // Installation runs after the initial server connections; handle those now,
  // as well as reconnects and hosts returning after a temporary outage.
  await reconcile()
  const recoveryTimer = setInterval(reconcile, 30000).unref()
  xo.on('server:connected', reconcile)
  xo.hooks.on('stop', () => {
    clearInterval(recoveryTimer)
    xo.removeListener('server:connected', reconcile)
  })
  xo.defineProperty('browserMedia', media)
  const unregisterRest = registerBrowserMediaRest(xo)
  xo.hooks.on('stop', unregisterRest)
  webServer.on('upgrade', (req, socket, head) => media.upgrade(req, socket, head))
  xo.hooks.on('stop', () => media.stop())
}
