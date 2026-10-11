import { createLogger } from '@xen-orchestra/log'
import { forbiddenOperation, incorrectState, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { parse as parseCookies } from 'cookie'
import { WebSocketServer } from 'ws'

import { BrowserIsoDevice, UnavailableIsoDevice } from './_device.mjs'
import {
  BrowserMediaSession,
  CLOSE_EJECTED,
  CLOSE_IDLE,
  CLOSE_INVALID,
  CLOSE_UNAVAILABLE,
  MAX_READ,
  parseIsoDescription,
} from './_session.mjs'
import {
  TAG,
  assertInsertable,
  blockOperations,
  ejectIso,
  findTaggedCds,
  findTaggedSrs,
  forgetSr,
  getInsertionHost,
  insertIso,
  unblockOperations,
} from './_xapi.mjs'

const log = createLogger('xo:browser-media')

const SOCKET_PATH = '/api/browser-media'
const MAX_SESSIONS = 16
// for a read, and between heartbeats: a sleeping or throttled tab is disconnected past it
const TIMEOUT = 30e3
const TICK_INTERVAL = 15e3
const RECONCILE_INTERVAL = 30e3
const RELEASE_RETRY_DELAY = 30e3
const STOP_TIMEOUT = 10e3
const DEFAULT_IDLE_TIMEOUT = 3600e3

// the session journal: what was started in a pool, by session id, so that it can be undone after
// a crash. Local to this XO: the sessions of another XO are none of its business
const STORE_NAMESPACE = 'browserMedia'

const SR_DESCRIPTION = 'ISO streamed from a browser by Xen Orchestra, released when the browser disconnects'

// a browser read is never split: the LUN reports it as its max transfer length. Bounds the memory
// a session can hold, with the reads served at once
const TARGET_OPTIONS = { maxTransferLength: MAX_READ, readConcurrency: 4 }

/**
 * Only host names are compared: a reverse proxy may drop the port from `Host`
 * (e.g. nginx `proxy_set_header Host $host`) while `Origin` keeps it.
 *
 * A request without `Origin` does not come from a browser page, which cannot
 * open a WebSocket without it: the authentication cookie is then enough.
 */
function isSameOrigin({ headers: { host, origin } }) {
  if (origin === undefined) {
    return true
  }
  try {
    return new URL(origin).hostname === new URL(`http://${host}`).hostname
  } catch {
    return false
  }
}

const refuseUpgrade = (socket, status) => socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`)

/**
 * Stream an ISO selected in a browser into the CD drive of a VM, without
 * uploading it first and without installing anything on the hosts.
 *
 * The browser connects to `/api/browser-media` (administrators only) and serves
 * the ISO over the WebSocket, see `_session.mjs`. Once inserted, the ISO is
 * served as a read-only iSCSI LUN by the live mount mixin, and attached to the
 * host of the VM as a temporary SR.
 *
 * The ISO stays inserted for as long as the browser stays connected, and has
 * been read recently (`browserMedia.idleTimeout`): then it is ejected, and
 * everything changed in the pool is undone. Meanwhile, the VM cannot migrate
 * nor be suspended. An ISO ejected by any other client also ends the session.
 *
 * What a session changed is tagged in the pool, and journaled before any change:
 * after a crash, it is undone once the pool is reachable again.
 */
export default class BrowserMedia {
  #app
  #enabled = false
  #idleTimeout = DEFAULT_IDLE_TIMEOUT
  #stopping = false

  /** @type {Map<string, BrowserMediaSession>} */
  #sessions = new Map()
  // id of the live mount serving a session -> session
  #sessionsByMountId = new Map()
  // opaque ref of the CD drive a session is inserted in -> session
  #sessionsByVbdRef = new Map()
  // session id -> recovery in progress
  #recoveries = new Map()
  // pools whose journal entries wait for a connection, reported once
  #missingPools = new Set()

  #store
  #webSockets

  // `tickInterval` is injectable for tests only
  constructor(app, { tickInterval = TICK_INTERVAL } = {}) {
    this.#app = app

    app.hooks.on('start', () => {
      if (app.config.getOptional('browserMedia.enabled') === false) {
        return
      }
      this.#enabled = true
      this.#idleTimeout = app.config.getOptionalDuration('browserMedia.idleTimeout') ?? DEFAULT_IDLE_TIMEOUT
      this.#webSockets = new WebSocketServer({ noServer: true, maxPayload: MAX_READ + 4, perMessageDeflate: false })

      const tick = setInterval(() => this.#tick(), tickInterval).unref()
      const reconcile = () => this.#reconcile().catch(error => log.warn('browser media recovery failed', { error }))
      const reconcileTimer = setInterval(reconcile, RECONCILE_INTERVAL).unref()
      const onServerConnected = ({ xapi }) => {
        this.#listen(xapi)
        reconcile()
      }
      app.on('server:connected', onServerConnected)
      for (const xapi of Object.values(app.getAllXapis())) {
        this.#listen(xapi)
      }
      // a mount also ends when its VDI disappears, e.g. its SR forgotten by hand
      const onUnmounted = id => this.#onUnmounted(id)
      app.liveMount.on('unmounted', onUnmounted)
      // must not delay the start
      reconcile()

      app.hooks.on('stop', async () => {
        this.#stopping = true
        clearInterval(tick)
        clearInterval(reconcileTimer)
        app.removeListener('server:connected', onServerConnected)
        const releases = [...this.#sessions.values()].map(session => {
          session.close(CLOSE_UNAVAILABLE, 'xo-server is stopping')
          return session.releasing
        })
        // what is left is undone by the recovery on next start
        let timer
        await Promise.race([
          Promise.allSettled(releases),
          new Promise(resolve => (timer = setTimeout(resolve, STOP_TIMEOUT))),
        ])
        clearTimeout(timer)
        app.liveMount.removeListener('unmounted', onUnmounted)
        this.#webSockets.close()
      })
    })
  }

  async #getStore() {
    this.#store ??= this.#app.getStore(STORE_NAMESPACE)
    return this.#store
  }

  #assertEnabled() {
    if (!this.#enabled) {
      throw forbiddenOperation('browser media', 'disabled by browserMedia.enabled')
    }
  }

  /** @returns {BrowserMediaSession} */
  #getSession(id) {
    const session = this.#sessions.get(id)
    if (session === undefined) {
      throw noSuchObject(id, 'browser-media')
    }
    return session
  }

  // ---------------------------------------------------------------------------
  // browser side

  /**
   * Handle a WebSocket upgrade if it is for this feature.
   *
   * @param {string} remoteAddress - of the client, as resolved by the web server
   * @returns {boolean} whether the request was for this feature
   */
  handleBrowserMediaUpgrade(req, socket, head, remoteAddress) {
    if (new URL(req.url, 'http://localhost').pathname !== SOCKET_PATH) {
      return false
    }
    this.#upgrade(req, socket, head, remoteAddress).catch(error => {
      log.warn('browser media connection failed', { error })
      refuseUpgrade(socket, '500 Internal Server Error')
    })
    return true
  }

  async #upgrade(req, socket, head, remoteAddress) {
    if (!this.#enabled || this.#stopping) {
      return refuseUpgrade(socket, '404 Not Found')
    }
    // only from XO's own pages, or from a client which is not a browser
    if (!isSameOrigin(req)) {
      return refuseUpgrade(socket, '403 Forbidden')
    }
    let user
    try {
      const { token } = parseCookies(req.headers.cookie ?? '')
      ;({ user } = await this.#app.authenticateUser({ token }, { ip: remoteAddress }))
    } catch {
      return refuseUpgrade(socket, '401 Unauthorized')
    }
    if (user.permission !== 'admin') {
      return refuseUpgrade(socket, '403 Forbidden')
    }

    this.#webSockets.handleUpgrade(req, socket, head, ws => {
      // the browser describes its ISO first
      const timer = setTimeout(() => ws.terminate(), TIMEOUT)
      ws.once('message', (data, binary) => {
        clearTimeout(timer)
        const iso = parseIsoDescription(data, binary)
        if (typeof iso === 'string') {
          return ws.close(CLOSE_INVALID, iso)
        }
        if (this.#stopping || this.#sessions.size >= MAX_SESSIONS) {
          return ws.close(
            CLOSE_UNAVAILABLE,
            this.#stopping ? 'xo-server is stopping' : 'too many browser media sessions'
          )
        }
        const session = new BrowserMediaSession({
          ...iso,
          owner: user.id,
          socket: ws,
          timeout: TIMEOUT,
          onClose: session => this.#onClose(session),
        })
        this.#sessions.set(session.id, session)
        log.info('browser media connected', { session: session.id, user: user.name, name: iso.name, size: iso.size })
      })
    })
  }

  #onClose(session) {
    log.info('browser media disconnected', { session: session.id, status: session.status })
    if (session.status === 'inserting') {
      // the insertion notices it, and undoes itself
      return
    }
    if (session.insertion === undefined) {
      this.#sessions.delete(session.id)
      return
    }
    this.#release(session).catch(() => {
      // logged and retried by #release
    })
  }

  #tick() {
    const now = Date.now()
    for (const session of this.#sessions.values()) {
      session.heartbeat()
      if (session.status === 'inserted' && now - (session.lastReadAt ?? session.insertedAt) > this.#idleTimeout) {
        // e.g. the OS is installed, and nobody thought of ejecting the ISO: nothing should stay
        // blocked for it
        log.info('ejecting a browser ISO no longer read', { session: session.id, vm: session.vmId })
        session.close(CLOSE_IDLE, 'not read for too long')
      }
    }
  }

  // ---------------------------------------------------------------------------
  // public API

  getAllBrowserMediaSessions() {
    return [...this.#sessions.values()].map(session => session.serialize())
  }

  getBrowserMediaSession(id) {
    return this.#getSession(id).serialize()
  }

  /**
   * Synchronous, so that the predictable failures are reported before starting a task.
   *
   * @returns {object | undefined} XO object of the CD drive to use, undefined if one is created
   */
  assertBrowserMediaInsertable({ id, vmId }) {
    this.#assertEnabled()
    const session = this.#getSession(id)
    if (session.status !== 'connected' || session.closed) {
      throw incorrectState({ actual: session.status, expected: 'connected', object: id, property: 'status' })
    }
    for (const other of this.#sessions.values()) {
      if (other.vmId === vmId && other.insertion !== undefined) {
        throw objectAlreadyExists({ objectId: vmId, objectType: 'browser media for this VM' })
      }
    }
    return assertInsertable(this.#app, this.#app.getObject(vmId, 'VM'))
  }

  async insertBrowserMedia({ id, vmId }) {
    const cd = this.assertBrowserMediaInsertable({ id, vmId })
    const app = this.#app
    const session = this.#getSession(id)
    const vm = app.getObject(vmId, 'VM')
    const xapi = app.getXapi(vm)
    const vmRef = vm._xapiRef

    session.status = 'inserting'
    session.vmId = vmId
    session.error = undefined
    // what has been done so far, undone by #release
    const insertion = (session.insertion = {})
    const assertConnected = () => {
      if (session.closed) {
        throw new Error('the browser disconnected during the insertion')
      }
    }
    try {
      // before any change: a crash from now on must not orphan anything
      await (await this.#getStore()).put(session.id, { pool: xapi.pool.uuid, vm: vm.uuid, createdAt: Date.now() })
      insertion.journaled = true

      const hostRef = await getInsertionHost(xapi, vmRef)
      insertion.blocked = true
      await blockOperations(xapi, vmRef, session.id)
      assertConnected()

      const mount = await app.liveMount.mountBlockDevice({
        lun: new BrowserIsoDevice(session),
        xapi,
        hostRef,
        kind: 'browser-media',
        nameLabel: session.name,
        nameDescription: SR_DESCRIPTION,
        smConfig: { [TAG]: session.id },
        targetOptions: TARGET_OPTIONS,
        // whatever ends the mount, the CD drive must be released while the target still answers
        beforeUnmount: () => this.#undoInsertion(session),
      })
      insertion.mountId = mount.id
      this.#sessionsByMountId.set(mount.id, session)
      assertConnected()

      insertion.vdiRef = await xapi.call('VDI.get_by_uuid', mount.vdiUuid)
      insertion.vbdRef = await insertIso(xapi, {
        vmRef,
        cdRef: cd?._xapiRef,
        vdiRef: insertion.vdiRef,
        sessionId: session.id,
      })
      this.#sessionsByVbdRef.set(insertion.vbdRef, session)
      assertConnected()

      session.status = 'inserted'
      session.vdiUuid = mount.vdiUuid
      session.insertedAt = Date.now()
      log.info('browser ISO inserted', { session: session.id, vm: vmId, vdi: mount.vdiUuid })
      return { vdiId: mount.vdiUuid }
    } catch (error) {
      session.error = error.message
      try {
        await this.#release(session)
      } catch {
        // logged and retried by #release
      }
      throw error
    }
  }

  async ejectBrowserMedia(id) {
    const session = this.#getSession(id)
    session.close(CLOSE_EJECTED, 'ejected')
    await session.releasing
  }

  // ---------------------------------------------------------------------------
  // undoing an insertion

  /**
   * Undo everything an insertion did, and forget the session once its browser is gone.
   *
   * Never rejects twice for the same attempt: the first failure is reported, and a new attempt is
   * scheduled until it succeeds — what is left meanwhile is journaled anyway.
   */
  #release(session) {
    if (session.releasing !== undefined) {
      return session.releasing
    }
    const wasInserted = session.status === 'inserted'
    if (wasInserted) {
      session.status = 'ejecting'
    }
    const releasing = (session.releasing = (async () => {
      const { insertion } = session
      try {
        if (insertion !== undefined) {
          if (insertion.mountId !== undefined) {
            // undoes the insertion first, see `beforeUnmount`
            await this.#app.liveMount.unmountBlockDevice(insertion.mountId)
          } else {
            await this.#undoInsertion(session)
          }
          if (insertion.journaled) {
            await (await this.#getStore()).del(session.id)
          }
        }
      } catch (error) {
        log.warn('could not release a browser ISO, will retry', { error, session: session.id })
        session.releasing = undefined
        if (!this.#stopping) {
          setTimeout(() => this.#release(session).catch(() => {}), RELEASE_RETRY_DELAY).unref()
        }
        throw error
      }
      if (wasInserted) {
        log.info('browser ISO ejected', { session: session.id, vm: session.vmId })
      }
      session.insertion = undefined
      session.releasing = undefined
      if (session.closed) {
        this.#sessions.delete(session.id)
      } else {
        // a failed insertion: the browser can try again
        session.status = 'connected'
        session.vmId = undefined
      }
    })())
    return releasing
  }

  /**
   * Called before the SR of the session is forgotten, whatever triggers it: release the CD drive and
   * the VM while the target still answers the host.
   */
  async #undoInsertion(session) {
    const { insertion, vmId } = session
    if (insertion === undefined) {
      return
    }
    const app = this.#app
    // the connection the insertion went through may have been replaced since
    let vm
    try {
      vm = app.getObject(vmId, 'VM')
    } catch (error) {
      if (!noSuchObject.is(error)) {
        throw error
      }
      // deleted with its CD drive and its blocked operations
      insertion.vbdRef = undefined
      insertion.blocked = false
      return
    }
    const xapi = app.getXapi(vm)
    if (insertion.vbdRef !== undefined) {
      this.#sessionsByVbdRef.delete(insertion.vbdRef)
      await ejectIso(xapi, { vbdRef: insertion.vbdRef, vdiRefs: [insertion.vdiRef], sessionId: session.id })
      insertion.vbdRef = undefined
    }
    if (insertion.blocked) {
      await unblockOperations(xapi, vm._xapiRef, session.id)
      insertion.blocked = false
    }
  }

  #onUnmounted(mountId) {
    const session = this.#sessionsByMountId.get(mountId)
    if (session === undefined) {
      return
    }
    this.#sessionsByMountId.delete(mountId)
    if (session.insertion !== undefined) {
      session.insertion.mountId = undefined
    }
    if (session.releasing === undefined) {
      // not ejected by this mixin, e.g. the SR was forgotten by hand: the ISO is gone
      session.close(CLOSE_EJECTED, 'the ISO storage was removed')
    }
  }

  /**
   * One listener per XAPI connection, never removed: it looks up the CD drives to watch at each
   * change. An ISO ejected or replaced by any other client, or a drive removed with its VM, ends the
   * session.
   */
  #listen(xapi) {
    const vbdEvents = xapi.objects.allIndexes.type.getEventEmitterByType('VBD')
    if (!vbdEvents.listeners('update').includes(this.#onVbdUpdated)) {
      vbdEvents.on('update', this.#onVbdUpdated)
      vbdEvents.on('remove', this.#onVbdRemoved)
    }
  }

  // only a change from the ISO to anything else: the events of the insertion itself may still be
  // delivered once it is over
  #onVbdUpdated = (vbd, previous) => {
    const session = this.#sessionsByVbdRef.get(vbd?.$ref)
    const vdiRef = session?.insertion?.vdiRef
    if (session !== undefined && previous?.VDI === vdiRef && vbd.VDI !== vdiRef) {
      log.info('the browser ISO was ejected by another client', { session: session.id })
      session.close(CLOSE_EJECTED, 'ejected')
    }
  }

  #onVbdRemoved = (_, vbd) => {
    const session = this.#sessionsByVbdRef.get(vbd?.$ref)
    if (session !== undefined) {
      this.#sessionsByVbdRef.delete(vbd.$ref)
      if (session.insertion !== undefined) {
        session.insertion.vbdRef = undefined
      }
      session.close(CLOSE_EJECTED, 'the CD drive was removed')
    }
  }

  // ---------------------------------------------------------------------------
  // recovery

  /** Undo the insertions journaled by a previous run of xo-server, in the pools reachable now. */
  async #reconcile() {
    if (this.#stopping) {
      return
    }
    const store = await this.#getStore()
    const entries = []
    for await (const entry of store.createReadStream()) {
      entries.push(entry)
    }
    await Promise.all(
      entries.map(({ key: sessionId, value: entry }) => {
        if (this.#sessions.has(sessionId) || this.#recoveries.has(sessionId)) {
          return undefined
        }
        const xapi = Object.values(this.#app.getAllXapis()).find(xapi => xapi.pool?.uuid === entry.pool)
        if (xapi === undefined) {
          if (!this.#missingPools.has(entry.pool)) {
            this.#missingPools.add(entry.pool)
            log.info('a browser ISO left by a previous run waits for its pool to be connected', { pool: entry.pool })
          }
          return undefined
        }
        const recovery = this.#recover(xapi, sessionId, entry)
          .then(() => store.del(sessionId))
          .then(
            () => log.info('released a browser ISO left by a previous run', { session: sessionId }),
            error => log.warn('could not release a browser ISO left by a previous run, will retry', { error })
          )
          .finally(() => this.#recoveries.delete(sessionId))
        this.#recoveries.set(sessionId, recovery)
        return recovery
      })
    )
  }

  async #recover(xapi, sessionId, { vm: vmUuid }) {
    let vmRef
    try {
      vmRef = await xapi.call('VM.get_by_uuid', vmUuid)
    } catch (error) {
      if (error.code !== 'UUID_INVALID') {
        throw error
      }
    }
    const srs = await findTaggedSrs(xapi, sessionId)

    // The target went away with the previous run: a host still logged in to it would wait for it
    // until its iSCSI replacement timeout, then fail to detach the ISO, and XAPI would keep a
    // datapath on the SR, which then prevents the VM from stopping once the SR is forgotten. Serve
    // it again, under the same identity, so that the host detaches it cleanly; its reads fail.
    const standbys = []
    try {
      for (const sr of srs) {
        for (const pbdRef of sr.PBDs) {
          const pbd = await xapi.getRecord('PBD', pbdRef)
          if (pbd.currently_attached) {
            standbys.push(await this.#serveStandby(xapi, pbd, sr))
          }
        }
      }
    } catch (error) {
      await Promise.allSettled(standbys.map(standby => standby.close()))
      throw error
    }

    try {
      if (vmRef !== undefined) {
        const vdiRefs = srs.flatMap(sr => sr.VDIs)
        for (const vbdRef of await findTaggedCds(xapi, vmRef, sessionId)) {
          await ejectIso(xapi, { vbdRef, vdiRefs, sessionId })
        }
        await unblockOperations(xapi, vmRef, sessionId)
      }
      for (const sr of srs) {
        await forgetSr(xapi, sr.$ref)
      }
    } finally {
      for (const standby of standbys) {
        await standby.close().catch(error => log.warn('could not stop a standby target', { error }))
      }
    }
  }

  async #serveStandby(xapi, pbd, sr) {
    const config = pbd.device_config
    const secret =
      config.chappassword ??
      (await xapi.call('secret.get_value', await xapi.call('secret.get_by_uuid', config.chappassword_secret)))
    // `iqn.2026-07.tech.vates.xo:browser-media-<id>`, as built by the live mount mixin
    const id = config.targetIQN.slice(config.targetIQN.lastIndexOf('-') + 1)
    const size = sr.VDIs.length === 0 ? MAX_READ : Number(await xapi.getField('VDI', sr.VDIs[0], 'virtual_size'))
    return this.#app.liveMount.serveBlockDevice({
      lun: new UnavailableIsoDevice(size),
      xapi,
      hostRef: pbd.host,
      kind: 'browser-media',
      id,
      chap: { user: config.chapuser, secret },
      port: Number(config.port),
      targetOptions: TARGET_OPTIONS,
    })
  }
}
