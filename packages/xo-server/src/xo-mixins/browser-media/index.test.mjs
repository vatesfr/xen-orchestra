import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import { createServer } from 'node:http'
import { after, afterEach, describe, it } from 'node:test'
import WebSocket from 'ws'

import BrowserMedia from './index.mjs'
import { TAG } from './_xapi.mjs'

const ISO_SIZE = 64 * 1024
const VM_ID = 'vm-uuid'
const VM_REF = 'OpaqueRef:vm'
const CD_REF = 'OpaqueRef:cd'
const HOST_REF = 'OpaqueRef:host'
const POOL_UUID = 'pool-uuid'

class XapiError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

/** A pool as XAPI records, and the calls made to it. */
function makeXapi({ powerState = 'Halted', cd = true } = {}) {
  const calls = []
  const records = {
    VM: {
      [VM_REF]: {
        uuid: VM_ID,
        power_state: powerState,
        resident_on: powerState === 'Running' ? HOST_REF : 'OpaqueRef:NULL',
        affinity: HOST_REF,
        blocked_operations: {},
        VBDs: cd ? [CD_REF] : [],
      },
    },
    VBD: cd ? { [CD_REF]: { VM: VM_REF, VDI: 'OpaqueRef:NULL', empty: true, other_config: {} } } : {},
    SR: {},
    PBD: {},
    VDI: {},
    Secret: { 'OpaqueRef:secret': { uuid: 'secret-uuid', value: 'secret-of-old' } },
  }
  const emitters = { __proto__: null }
  const getEventEmitterByType = type => (emitters[type] ??= new EventEmitter())
  const get = (type, ref) => {
    const record = records[type][ref]
    if (record === undefined) {
      throw new XapiError('HANDLE_INVALID')
    }
    return record
  }
  const handle = (method, ...args) => {
    calls.push([method, ...args])
    const [ref, key, value] = args
    switch (method) {
      case 'VM.get_by_uuid': {
        const entry = Object.entries(records.VM).find(([, vm]) => vm.uuid === ref)
        if (entry === undefined) {
          throw new XapiError('UUID_INVALID')
        }
        return entry[0]
      }
      case 'VM.get_possible_hosts':
        return [HOST_REF]
      case 'VM.add_to_blocked_operations':
        get('VM', ref).blocked_operations[key] = value
        return
      case 'VM.remove_from_blocked_operations':
        delete get('VM', ref).blocked_operations[key]
        return
      case 'VDI.get_by_uuid':
        return `OpaqueRef:vdi-${ref}`
      case 'VBD.add_to_other_config':
        get('VBD', ref).other_config[key] = value
        return
      case 'VBD.remove_from_other_config':
        delete get('VBD', ref).other_config[key]
        return
      case 'VBD.insert':
        Object.assign(get('VBD', ref), { VDI: key, empty: false })
        return
      case 'VBD.eject':
        Object.assign(get('VBD', ref), { VDI: 'OpaqueRef:NULL', empty: true })
        return
      case 'VBD.destroy':
        delete records.VBD[ref]
        get('VM', VM_REF).VBDs = get('VM', VM_REF).VBDs.filter(_ => _ !== ref)
        return
      case 'SR.get_all_records':
        return records.SR
      case 'PBD.unplug':
        get('PBD', ref).currently_attached = false
        return
      case 'SR.forget':
        delete records.SR[ref]
        return
      case 'secret.get_by_uuid':
        return Object.entries(records.Secret).find(([, secret]) => secret.uuid === ref)[0]
      case 'secret.get_value':
        return get('Secret', ref).value
      default:
        throw new Error(`unexpected call: ${method}`)
    }
  }
  return {
    calls,
    records,
    pool: { uuid: POOL_UUID },
    objects: { allIndexes: { type: { getEventEmitterByType } } },
    emit: (type, event, ...args) => getEventEmitterByType(type).emit(event, ...args),
    async call(...args) {
      return handle(...args)
    },
    async callAsync(...args) {
      return handle(...args)
    },
    async getField(type, ref, field) {
      return get(type, ref)[field]
    },
    async getRecord(type, ref) {
      return { ...get(type, ref), $ref: ref }
    },
    async VBD_create({ VM, VDI, other_config }) {
      calls.push(['VBD_create', { VM, VDI, other_config }])
      records.VBD['OpaqueRef:new-cd'] = { VM, VDI, empty: false, other_config: { ...other_config } }
      get('VM', VM).VBDs.push('OpaqueRef:new-cd')
      return 'OpaqueRef:new-cd'
    },
  }
}

/** Stands for the live mount mixin: records the mounts, runs `beforeUnmount` like it does. */
function makeLiveMount({ mountError } = {}) {
  const liveMount = new EventEmitter()
  liveMount.mounts = new Map()
  liveMount.served = []
  liveMount.mountBlockDevice = async params => {
    if (mountError !== undefined) {
      throw mountError
    }
    const id = `mount-${liveMount.mounts.size}`
    liveMount.mounts.set(id, params)
    return { id, vdiUuid: 'vdi-uuid', srUuid: 'sr-uuid' }
  }
  liveMount.unmountBlockDevice = async id => {
    const params = liveMount.mounts.get(id)
    await params.beforeUnmount?.()
    liveMount.mounts.delete(id)
    liveMount.emit('unmounted', id)
  }
  liveMount.serveBlockDevice = async params => {
    const served = { params, closed: false, close: async () => (served.closed = true) }
    liveMount.served.push(served)
    return served
  }
  return liveMount
}

function makeStore(entries = {}) {
  const map = new Map(Object.entries(entries))
  return {
    map,
    async put(key, value) {
      map.set(key, value)
    },
    async del(key) {
      map.delete(key)
    },
    async *createReadStream() {
      for (const [key, value] of map) {
        yield { key, value }
      }
    },
  }
}

const servers = []
after(() => Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))))

const sockets = []
afterEach(() => {
  for (const socket of sockets.splice(0)) {
    socket.terminate()
  }
})

async function setup({
  xapi = makeXapi(),
  liveMount = makeLiveMount(),
  store = makeStore(),
  config = {},
  tickInterval,
} = {}) {
  const app = new EventEmitter()
  app.hooks = new EventEmitter()
  app.config = {
    getOptional: path => config[path],
    getOptionalDuration: path => config[path],
  }
  app.liveMount = liveMount
  app.getStore = async () => store
  app.getAllXapis = () => ({ server: xapi })
  app.getXapi = () => xapi
  app.authenticateUser = async ({ token }) => {
    if (token === 'admin-token') {
      return { user: { id: 'admin-id', name: 'admin', permission: 'admin' } }
    }
    if (token === 'user-token') {
      return { user: { id: 'user-id', name: 'user', permission: 'none' } }
    }
    throw new Error('invalid credentials')
  }
  app.getObject = (id, type) => {
    if (type === 'VM' && id === VM_ID) {
      const vm = xapi.records.VM[VM_REF]
      if (vm === undefined) {
        throw Object.assign(new Error('no such VM'), { code: 1 })
      }
      return {
        id: VM_ID,
        uuid: VM_ID,
        _xapiRef: VM_REF,
        power_state: vm.power_state,
        high_availability: '',
        $VBDs: vm.VBDs,
      }
    }
    const vbd = xapi.records.VBD[id]
    if (vbd !== undefined) {
      return {
        id,
        _xapiRef: id,
        is_cd_drive: true,
        attached: vbd.VM !== undefined,
        VDI: vbd.empty ? undefined : vbd.VDI,
      }
    }
    throw new Error(`unknown object ${id}`)
  }

  const media = new BrowserMedia(app, { tickInterval })
  app.hooks.emit('start')

  const server = createServer()
  server.on('upgrade', (req, socket, head) => {
    if (!media.handleBrowserMediaUpgrade(req, socket, head, '127.0.0.1')) {
      socket.destroy()
    }
  })
  server.listen(0)
  await once(server, 'listening')
  servers.push(server)
  const url = `ws://127.0.0.1:${server.address().port}/api/browser-media`

  return { app, liveMount, media, store, url, xapi }
}

/** A browser serving an ISO filled with 0x5a. */
async function connect(url, { token = 'admin-token', iso = { name: 'debian.iso', size: ISO_SIZE } } = {}) {
  const socket = new WebSocket(url, { headers: { cookie: `token=${token}` } })
  sockets.push(socket)
  await once(socket, 'open')
  socket.send(JSON.stringify(iso))
  const [data] = await once(socket, 'message')
  const { session } = JSON.parse(data.toString())
  socket.on('message', (data, binary) => {
    if (binary) {
      return
    }
    const { id, length } = JSON.parse(data.toString())
    const reply = Buffer.alloc(4 + length, 0x5a)
    reply.writeUInt32BE(id, 0)
    socket.send(reply)
  })
  return { session, socket }
}

const upgradeStatus = (url, headers) =>
  new Promise(resolve => {
    const socket = new WebSocket(url, { headers })
    socket.on('unexpected-response', (_, res) => resolve(res.statusCode))
    socket.on('open', () => {
      socket.terminate()
      resolve(101)
    })
    socket.on('error', () => {})
  })

const until = async predicate => {
  for (let i = 0; i < 200; ++i) {
    if (await predicate()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  assert.fail('timed out')
}

describe('browser connection', () => {
  it('requires an authenticated administrator, from XO pages or outside a browser', async () => {
    const { url } = await setup()
    assert.equal(await upgradeStatus(url, {}), 401)
    assert.equal(await upgradeStatus(url, { cookie: 'token=user-token' }), 403)
    assert.equal(await upgradeStatus(url, { cookie: 'token=admin-token', origin: 'https://evil.example' }), 403)
    assert.equal(await upgradeStatus(url, { cookie: 'token=admin-token' }), 101)
  })

  it('is refused when disabled', async () => {
    const { url } = await setup({ config: { 'browserMedia.enabled': false } })
    assert.equal(await upgradeStatus(url, { cookie: 'token=admin-token' }), 404)
  })

  it('lists the session of a connected browser, and forgets it when it disconnects', async () => {
    const { media, url } = await setup()
    const { session, socket } = await connect(url)

    assert.deepEqual(
      media
        .getAllBrowserMediaSessions()
        .map(({ id, name, size, owner, status }) => ({ id, name, size, owner, status })),
      [{ id: session, name: 'debian.iso', size: ISO_SIZE, owner: 'admin-id', status: 'connected' }]
    )

    socket.close()
    await until(() => media.getAllBrowserMediaSessions().length === 0)
  })

  it('closes the connection of a browser describing an invalid ISO', async () => {
    const { url } = await setup()
    const socket = new WebSocket(url, { headers: { cookie: 'token=admin-token' } })
    sockets.push(socket)
    await once(socket, 'open')
    socket.send(JSON.stringify({ name: 'a.iso', size: 1000 }))
    const [code] = await once(socket, 'close')
    assert.equal(code, 4400)
  })
})

describe('insertBrowserMedia', () => {
  it('serves the ISO read-only through a live mount, and inserts it in the CD drive', async () => {
    const { liveMount, media, store, url, xapi } = await setup()
    const { session } = await connect(url)

    assert.deepEqual(await media.insertBrowserMedia({ id: session, vmId: VM_ID }), { vdiId: 'vdi-uuid' })

    const [params] = liveMount.mounts.values()
    assert.equal(params.kind, 'browser-media')
    assert.equal(params.hostRef, HOST_REF)
    assert.equal(params.nameLabel, 'debian.iso')
    assert.deepEqual(params.smConfig, { [TAG]: session })
    assert.equal(params.lun.readOnly, true)
    assert.equal(params.lun.getSize(), ISO_SIZE)
    // the LUN is read from the browser
    assert.deepEqual(await params.lun.read(0, 512), Buffer.alloc(512, 0x5a))

    // blkback, not tapdisk, which refuses a raw device
    const cd = xapi.records.VBD[CD_REF]
    assert.equal(cd.VDI, 'OpaqueRef:vdi-vdi-uuid')
    assert.equal(cd.other_config['backend-kind'], 'vbd')
    assert.deepEqual(JSON.parse(cd.other_config[TAG]), { session, created: false, backendKind: true })

    assert.deepEqual(Object.keys(xapi.records.VM[VM_REF].blocked_operations).sort(), [
      'checkpoint',
      'migrate_send',
      'pool_migrate',
      'suspend',
    ])
    assert.deepEqual(store.map.get(session), {
      pool: POOL_UUID,
      vm: VM_ID,
      createdAt: store.map.get(session).createdAt,
    })
    assert.equal(media.getBrowserMediaSession(session).status, 'inserted')
  })

  it('creates a CD drive in a halted VM without one, and removes it on eject', async () => {
    const { media, url, xapi } = await setup({ xapi: makeXapi({ cd: false }) })
    const { session } = await connect(url)

    await media.insertBrowserMedia({ id: session, vmId: VM_ID })
    const created = xapi.calls.find(([method]) => method === 'VBD_create')[1]
    assert.equal(created.other_config['backend-kind'], 'vbd')

    await media.ejectBrowserMedia(session)
    assert.deepEqual(xapi.records.VM[VM_REF].VBDs, [])
  })

  it('refuses a running VM without a plugged CD drive, and a CD drive which is not empty', async () => {
    const { media, url, xapi } = await setup({ xapi: makeXapi({ powerState: 'Running', cd: false }) })
    const { session } = await connect(url)
    assert.throws(() => media.assertBrowserMediaInsertable({ id: session, vmId: VM_ID }), /incorrect state/)

    xapi.records.VM[VM_REF].power_state = 'Halted'
    xapi.records.VM[VM_REF].VBDs = [CD_REF]
    xapi.records.VBD[CD_REF] = { VM: VM_REF, VDI: 'OpaqueRef:other-iso', empty: false, other_config: {} }
    assert.throws(() => media.assertBrowserMediaInsertable({ id: session, vmId: VM_ID }), /incorrect state/)
  })

  it('undoes everything when the mount fails, and lets the browser try again', async () => {
    const { media, store, url, xapi } = await setup({ liveMount: makeLiveMount({ mountError: new Error('no route') }) })
    const { session } = await connect(url)

    await assert.rejects(media.insertBrowserMedia({ id: session, vmId: VM_ID }), /no route/)

    assert.deepEqual(xapi.records.VM[VM_REF].blocked_operations, {})
    assert.equal(store.map.size, 0)
    const { status, error } = media.getBrowserMediaSession(session)
    assert.deepEqual({ status, error }, { status: 'connected', error: 'no route' })
  })
})

describe('end of an insertion', () => {
  const insert = async options => {
    const context = await setup(options)
    const browser = await connect(context.url)
    await context.media.insertBrowserMedia({ id: browser.session, vmId: VM_ID })
    return { ...context, ...browser }
  }

  const assertReleased = ({ liveMount, media, store, xapi }) => {
    const cd = xapi.records.VBD[CD_REF]
    assert.equal(cd.empty, true)
    assert.deepEqual(cd.other_config, {})
    assert.deepEqual(xapi.records.VM[VM_REF].blocked_operations, {})
    assert.equal(liveMount.mounts.size, 0)
    assert.equal(store.map.size, 0)
    assert.deepEqual(media.getAllBrowserMediaSessions(), [])
  }

  it('releases everything when the browser disconnects', async () => {
    const context = await insert()
    context.socket.close()
    await until(() => context.liveMount.mounts.size === 0 && context.store.map.size === 0)
    assertReleased(context)
  })

  it('releases everything on eject, and disconnects the browser', async () => {
    const context = await insert()
    const closed = once(context.socket, 'close')
    await context.media.ejectBrowserMedia(context.session)
    assert.equal((await closed)[0], 4410)
    assertReleased(context)
  })

  it('releases everything when another client ejects the ISO', async () => {
    const context = await insert()
    const { xapi } = context
    const previous = { ...xapi.records.VBD[CD_REF], $ref: CD_REF }
    await xapi.call('VBD.eject', CD_REF)
    xapi.emit('VBD', 'update', { ...xapi.records.VBD[CD_REF], $ref: CD_REF }, previous)
    await until(() => context.store.map.size === 0)
    assertReleased(context)
  })

  it('ignores the events of the insertion itself', async () => {
    const context = await insert()
    const { media, session, xapi } = context
    // emitted before VBD.insert, delivered after it
    const empty = { ...xapi.records.VBD[CD_REF], VDI: 'OpaqueRef:NULL', $ref: CD_REF }
    xapi.emit('VBD', 'update', empty, { ...empty, other_config: {} })
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(media.getBrowserMediaSession(session).status, 'inserted')
  })

  it('ejects an ISO which has not been read for too long', async () => {
    const context = await insert({ config: { 'browserMedia.idleTimeout': 0 }, tickInterval: 10 })
    const [code] = await once(context.socket, 'close')
    assert.equal(code, 4408)
    await until(() => context.store.map.size === 0)
    assertReleased(context)
  })
})

describe('recovery', () => {
  it('undoes the insertion of a previous run, serving the ISO again while the host detaches it', async () => {
    const xapi = makeXapi({ powerState: 'Running' })
    const session = 'old-session'
    Object.assign(xapi.records.VM[VM_REF].blocked_operations, {
      suspend: `an ISO is streamed into this VM from a browser (${TAG}:${session})`,
      destroy: 'protected by someone else',
    })
    Object.assign(xapi.records.VBD[CD_REF], {
      VDI: 'OpaqueRef:old-vdi',
      empty: false,
      other_config: {
        'backend-kind': 'vbd',
        [TAG]: JSON.stringify({ session, created: false, backendKind: true }),
      },
    })
    xapi.records.SR['OpaqueRef:old-sr'] = {
      sm_config: { [TAG]: session },
      PBDs: ['OpaqueRef:old-pbd'],
      VDIs: ['OpaqueRef:old-vdi'],
    }
    xapi.records.PBD['OpaqueRef:old-pbd'] = {
      host: HOST_REF,
      currently_attached: true,
      device_config: {
        chapuser: 'xo-0123abcd',
        chappassword_secret: 'secret-uuid',
        port: '45678',
        target: '192.168.1.30',
        targetIQN: 'iqn.2026-07.tech.vates.xo:browser-media-0123abcd',
      },
    }
    xapi.records.VDI['OpaqueRef:old-vdi'] = { virtual_size: String(ISO_SIZE) }
    const store = makeStore({ [session]: { pool: POOL_UUID, vm: VM_ID, createdAt: 0 } })

    const { liveMount } = await setup({ xapi, store })
    await until(() => store.map.size === 0)

    const [standby] = liveMount.served
    assert.equal(standby.params.id, '0123abcd')
    assert.equal(standby.params.port, 45678)
    assert.deepEqual(standby.params.chap, { user: 'xo-0123abcd', secret: 'secret-of-old' })
    assert.equal(standby.params.hostRef, HOST_REF)
    assert.equal(standby.params.lun.getSize(), ISO_SIZE)
    await assert.rejects(standby.params.lun.read(0, 512), /gone/)
    assert.equal(standby.closed, true)

    // ejected while served, then forgotten
    const ejectIndex = xapi.calls.findIndex(([method]) => method === 'VBD.eject')
    const forgetIndex = xapi.calls.findIndex(([method]) => method === 'SR.forget')
    assert.ok(ejectIndex !== -1 && ejectIndex < forgetIndex)
    assert.deepEqual(xapi.records.VBD[CD_REF].other_config, {})
    assert.deepEqual(xapi.records.VM[VM_REF].blocked_operations, { destroy: 'protected by someone else' })
    assert.deepEqual(xapi.records.SR, {})
  })

  it('does not eject an ISO another client inserted meanwhile', async () => {
    const xapi = makeXapi()
    const session = 'old-session'
    Object.assign(xapi.records.VBD[CD_REF], {
      VDI: 'OpaqueRef:someone-else',
      empty: false,
      other_config: { [TAG]: JSON.stringify({ session, created: false, backendKind: false }) },
    })
    const store = makeStore({ [session]: { pool: POOL_UUID, vm: VM_ID, createdAt: 0 } })

    await setup({ xapi, store })
    await until(() => store.map.size === 0)

    assert.equal(xapi.records.VBD[CD_REF].VDI, 'OpaqueRef:someone-else')
    assert.ok(!xapi.calls.some(([method]) => method === 'VBD.eject'))
  })

  it('keeps the journal entry while the ISO cannot be served again for a running VM', async () => {
    const xapi = makeXapi({ powerState: 'Running' })
    const session = 'old-session'
    xapi.records.SR['OpaqueRef:old-sr'] = { sm_config: { [TAG]: session }, PBDs: ['OpaqueRef:old-pbd'], VDIs: [] }
    xapi.records.PBD['OpaqueRef:old-pbd'] = {
      host: HOST_REF,
      currently_attached: true,
      device_config: { chapuser: 'u', chappassword: 'p', port: '1', targetIQN: 'iqn.x:browser-media-1' },
    }
    const liveMount = makeLiveMount()
    liveMount.serveBlockDevice = async () => {
      throw new Error('EADDRINUSE')
    }
    const store = makeStore({ [session]: { pool: POOL_UUID, vm: VM_ID, createdAt: 0 } })

    await setup({ xapi, store, liveMount })
    await new Promise(resolve => setTimeout(resolve, 20))

    assert.equal(store.map.size, 1)
    assert.ok(xapi.records.SR['OpaqueRef:old-sr'] !== undefined)
  })
})
