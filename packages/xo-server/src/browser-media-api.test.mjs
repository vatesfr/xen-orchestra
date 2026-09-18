import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attach, create, disconnect } from './api/browser-media.mjs'

function fixture({ failInsert = false } = {}) {
  const calls = []
  const session = {
    id: 'session',
    vm: 'vm',
    name: 'boot.iso',
    size: 32768,
    readToken: 'read',
    socket: { readyState: 1 },
  }
  const xapi = {
    async call(method, ...args) {
      calls.push([method, ...args])
      switch (method) {
        case 'VM.get_record':
          return { power_state: 'Running', resident_on: 'host', VBDs: ['cd'] }
        case 'VBD.get_record':
          return { type: 'CD', empty: true, currently_attached: true }
        case 'VBD.insert':
          if (failInsert) throw new Error('insert failed')
          break
        case 'VDI.get_VBDs':
          return ['cd']
        case 'VBD.get_VDI':
          return 'vdi'
        case 'SR.get_PBDs':
          return ['pbd', 'pbd-2']
        case 'PBD.get_currently_attached':
          return true
        case 'VDI.get_uuid':
          return 'vdi-uuid'
      }
    },
    async SR_create(opts) {
      calls.push(['SR_create', opts])
      return 'sr'
    },
    async VDI_create(opts) {
      calls.push(['VDI_create', opts])
      return 'vdi'
    },
  }
  const media = {
    origin: 'https://xo.example',
    get: () => session,
    close(s) {
      if (s.closed) return
      s.closed = true
      s.onClose?.()
    },
  }
  const xo = {
    browserMedia: media,
    apiContext: { user: { id: 'admin' } },
    getObject: () => ({ _xapiRef: 'vm-ref' }),
    getXapi: () => xapi,
  }
  return { xo, xapi, session, calls }
}

test('attaches a read-only VDI on a shared SR and cleans up in dependency order', async () => {
  const { xo, calls } = fixture()
  assert.deepEqual(await attach.call(xo, { id: 'session' }), { vdi: 'vdi-uuid' })
  const sr = calls.find(call => call[0] === 'SR_create')[1]
  assert.equal(sr.host, 'host')
  assert.equal(sr.type, 'browseriso')
  assert.equal(sr.shared, true)
  assert.equal(sr.sm_config['browser-media-session'], 'session')
  assert.equal(calls.filter(call => call[0] === 'PBD.get_currently_attached').length, 2)
  assert.equal(calls.find(call => call[0] === 'VDI_create')[1].read_only, true)
  await disconnect.call(xo, { id: 'session' })
  const methods = calls.map(call => call[0])
  assert.ok(methods.indexOf('VBD.eject') < methods.indexOf('VDI.destroy'))
  assert.ok(methods.indexOf('VDI.destroy') < methods.indexOf('PBD.unplug'))
  assert.ok(methods.indexOf('PBD.destroy') < methods.indexOf('SR.forget'))
})

test('failed insertion rolls back resources', async () => {
  const { xo, session, calls } = fixture({ failInsert: true })
  await assert.rejects(attach.call(xo, { id: 'session' }), /insert failed/)
  await session.cleanup()
  assert.equal(session.closed, true)
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
})

test('disconnect during attachment waits for resource creation then cleans up', async () => {
  const { xo, xapi, session, calls } = fixture()
  let finish
  let started
  const starting = new Promise(resolve => {
    started = resolve
  })
  xapi.SR_create = () =>
    new Promise(resolve => {
      finish = resolve
      started()
    })
  const attaching = attach.call(xo, { id: 'session' })
  await starting
  const disconnected = disconnect.call(xo, { id: 'session' })
  finish('sr')
  await assert.rejects(attaching, /disconnected/)
  await disconnected
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
  assert.ok(!calls.some(call => call[0] === 'VBD.insert'))
  assert.equal(session.closed, true)
})

test('cleanup does not eject replacement media', async () => {
  const { xo, xapi, calls } = fixture()
  await attach.call(xo, { id: 'session' })
  const call = xapi.call
  xapi.call = (method, ...args) => (method === 'VBD.get_VDI' ? Promise.resolve('replacement') : call(method, ...args))
  await disconnect.call(xo, { id: 'session' })
  assert.ok(!calls.some(call => call[0] === 'VBD.eject'))
})

test('rejects initial connection to a suspended VM', () => {
  const { xo } = fixture()
  assert.throws(
    () => create.call(xo, { vm: { power_state: 'Suspended' }, name: 'boot.iso', size: 32768 }),
    /running or halted/
  )
})

test('rolls back shared media when a pool PBD is unavailable', async () => {
  const { xo, xapi, calls, session } = fixture()
  const call = xapi.call
  xapi.call = (method, ...args) =>
    method === 'PBD.get_currently_attached' ? Promise.resolve(false) : call(method, ...args)
  await assert.rejects(attach.call(xo, { id: 'session' }), /every pool host/)
  await session.cleanup()
  assert.ok(!calls.some(call => call[0] === 'VDI_create'))
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
})

test('recovers the SR reference if shared SR creation fails after creating metadata', async () => {
  const { xo, xapi, calls, session } = fixture()
  xapi.SR_create = async () => {
    throw new Error('host attach failed')
  }
  const call = xapi.call
  xapi.call = (method, ...args) =>
    method === 'SR.get_all_records'
      ? Promise.resolve({ sr: { sm_config: { 'browser-media-session': 'session' } } })
      : call(method, ...args)
  await assert.rejects(attach.call(xo, { id: 'session' }), /host attach failed/)
  await session.cleanup()
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
})

test('attaches media while halted using the pool coordinator', async () => {
  const { xo, xapi, calls } = fixture()
  const call = xapi.call
  xapi.call = (method, ...args) => {
    if (method === 'VM.get_record')
      return Promise.resolve({ power_state: 'Halted', resident_on: 'OpaqueRef:NULL', VBDs: ['cd'] })
    if (method === 'pool.get_all') return Promise.resolve(['pool'])
    if (method === 'pool.get_master') return Promise.resolve('coordinator')
    return call(method, ...args)
  }
  await attach.call(xo, { id: 'session' })
  assert.equal(calls.find(call => call[0] === 'SR_create')[1].host, 'coordinator')
  assert.ok(calls.some(call => call[0] === 'VBD.insert'))
  await disconnect.call(xo, { id: 'session' })
})

for (const missing of [true, false]) {
  test(`rejects a running VM with ${missing ? 'no' : 'an unattached'} CD drive before creating storage`, async () => {
    const { xo, xapi, calls, session } = fixture()
    const call = xapi.call
    xapi.call = (method, ...args) => {
      if (method === 'VM.get_record')
        return Promise.resolve({ power_state: 'Running', resident_on: 'host', VBDs: missing ? [] : ['cd'] })
      if (method === 'VBD.get_record') return Promise.resolve({ type: 'CD', empty: true, currently_attached: false })
      return call(method, ...args)
    }
    await assert.rejects(attach.call(xo, { id: 'session' }), /Shut down the VM/)
    await session.cleanup()
    assert.ok(!calls.some(call => call[0] === 'SR_create'))
  })
}

test('creates a missing CD drive while halted', async () => {
  const { xo, xapi, calls } = fixture()
  const call = xapi.call
  xapi.call = (method, ...args) => {
    if (method === 'VM.get_record') return Promise.resolve({ power_state: 'Halted', VBDs: [] })
    if (method === 'pool.get_all') return Promise.resolve(['pool'])
    if (method === 'pool.get_master') return Promise.resolve('coordinator')
    return call(method, ...args)
  }
  xapi.VBD_create = async opts => calls.push(['VBD_create', opts])
  await attach.call(xo, { id: 'session' })
  const drive = calls.find(call => call[0] === 'VBD_create')[1]
  assert.equal(drive.type, 'CD')
  assert.equal(drive.VDI, 'vdi')
  await disconnect.call(xo, { id: 'session' })
})
