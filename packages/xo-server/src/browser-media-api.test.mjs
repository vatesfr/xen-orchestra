import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attach, create, disconnect } from './api/browser-media.mjs'

function fixture({ failInsert = false, powerState = 'Running', vbds = ['cd'], affinity } = {}) {
  const calls = []
  const session = { id: 'session', vm: 'vm', name: 'boot.iso', size: 32768, socket: { readyState: 1 } }
  const xapi = {
    async call(method, ...args) {
      calls.push([method, ...args])
      switch (method) {
        case 'VM.get_record':
          return { power_state: powerState, resident_on: 'host', VBDs: vbds, affinity }
        case 'VM.get_possible_hosts':
          return ['host', 'preferred']
        case 'VBD.get_record':
          return { type: 'CD', empty: true, currently_attached: true, VDI: 'vdi' }
        case 'VBD.insert':
          if (failInsert) throw new Error('insert failed')
          break
        case 'VDI.get_VBDs':
          return ['cd']
        case 'VBD.get_VDI':
          return 'vdi'
        case 'SR.introduce':
        case 'SR.get_by_uuid':
          return 'sr'
        case 'SR.get_record':
          return { type: 'iscsi', sm_config: { 'xo:browser-media': session.id } }
        case 'SR.get_VDIs':
          return ['vdi']
        case 'SR.get_PBDs':
          return ['pbd']
        case 'PBD.create':
          return 'pbd'
        case 'PBD.get_currently_attached':
          return true
        case 'VDI.get_uuid':
          return 'vdi-uuid'
      }
    },
    callAsync(method, ...args) {
      return this.call(method, ...args)
    },
    async VBD_create(opts) {
      calls.push(['VBD_create', opts])
      return 'cd'
    },
  }
  const media = {
    get: () => session,
    async createTarget() {
      calls.push(['target.listen'])
      return {
        deviceConfig: {
          target: '192.0.2.1',
          port: '3269',
          targetIQN: 'iqn.test',
          chapuser: 'user',
          chappassword: 'secret',
        },
        async close() {
          calls.push(['target.close'])
        },
      }
    },
    release() {
      calls.push(['release'])
    },
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

test('introduces a stock raw iSCSI LUN as a CD and forgets it without destroying the LUN', async () => {
  const { xo, calls } = fixture()
  assert.deepEqual(await attach.call(xo, { id: 'session' }), { vdi: 'vdi-uuid' })
  const sr = calls.find(call => call[0] === 'SR.introduce')
  assert.equal(sr[4], 'iscsi')
  assert.equal(sr[6], false)
  assert.equal(calls.find(call => call[0] === 'PBD.create')[1].host, 'host')
  const vdi = calls.find(call => call[0] === 'VDI.introduce')
  assert.deepEqual(vdi[11], { LUNid: '0', type: 'raw' })
  assert.equal(vdi[7], true)
  await disconnect.call(xo, { id: 'session' })
  const methods = calls.map(call => call[0])
  assert.ok(!methods.includes('VDI.destroy'))
  assert.ok(!methods.includes('SR.destroy'))
  assert.ok(methods.indexOf('VBD.eject') < methods.indexOf('PBD.unplug'))
  assert.ok(methods.indexOf('PBD.destroy') < methods.indexOf('SR.forget'))
  assert.ok(methods.indexOf('SR.forget') < methods.indexOf('target.close'))
})

test('failed insertion rolls back resources and target', async () => {
  const { xo, session, calls } = fixture({ failInsert: true })
  await assert.rejects(attach.call(xo, { id: 'session' }), /insert failed/)
  await session.cleanup()
  assert.equal(session.closed, true)
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
  assert.ok(calls.some(call => call[0] === 'target.close'))
})

test('disconnect during PBD plug waits for attachment then rolls back without inserting', async () => {
  const { xo, xapi, session, calls } = fixture()
  let finish, started
  const starting = new Promise(resolve => {
    started = resolve
  })
  const callAsync = xapi.callAsync.bind(xapi)
  xapi.callAsync = (method, ...args) =>
    method === 'PBD.plug'
      ? new Promise(resolve => {
          finish = resolve
          started()
        })
      : callAsync(method, ...args)
  const attaching = attach.call(xo, { id: 'session' })
  await starting
  const disconnected = disconnect.call(xo, { id: 'session' })
  finish()
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
  xapi.call = (method, ...args) =>
    method === 'VBD.get_record' ? Promise.resolve({ type: 'CD', VDI: 'replacement' }) : call(method, ...args)
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

for (const method of ['PBD.plug', 'VDI.introduce']) {
  test(`failed ${method} rolls back SR and closes target`, async () => {
    const { xo, xapi, calls, session } = fixture()
    const call = xapi.call
    xapi.call = (m, ...args) => (m === method ? Promise.reject(new Error('injected failure')) : call(m, ...args))
    await assert.rejects(attach.call(xo, { id: 'session' }), /injected failure/)
    await session.cleanup()
    assert.ok(!calls.some(call => call[0] === 'VBD.insert'))
    assert.ok(calls.some(call => call[0] === 'SR.forget'))
    assert.ok(calls.some(call => call[0] === 'target.close'))
  })
}

test('recovers an SR introduced before a lost API response', async () => {
  const { xo, xapi, calls, session } = fixture()
  const call = xapi.call
  xapi.call = (method, ...args) =>
    method === 'SR.introduce' ? Promise.reject(new Error('lost response')) : call(method, ...args)
  await assert.rejects(attach.call(xo, { id: 'session' }), /lost response/)
  await session.cleanup()
  assert.ok(calls.some(call => call[0] === 'SR.get_by_uuid'))
  assert.ok(calls.some(call => call[0] === 'SR.forget'))
})

test('a failed detach retains the target and can be retried', async () => {
  const { xo, xapi, session, calls } = fixture()
  await attach.call(xo, { id: 'session' })
  const call = xapi.call
  xapi.call = (method, ...args) =>
    method === 'PBD.unplug' ? Promise.reject(new Error('host offline')) : call(method, ...args)
  await assert.rejects(disconnect.call(xo, { id: 'session' }), /host offline/)
  assert.ok(!calls.some(call => call[0] === 'target.close'))
  assert.ok(!calls.some(call => call[0] === 'SR.forget'))
  xapi.call = call
  await session.cleanup()
  assert.ok(calls.some(call => call[0] === 'target.close'))
})

test('halted VM uses a possible host, preferring its affinity', async () => {
  const { xo, calls } = fixture({ powerState: 'Halted', affinity: 'preferred' })
  await attach.call(xo, { id: 'session' })
  assert.equal(calls.find(call => call[0] === 'PBD.create')[1].host, 'preferred')
  await disconnect.call(xo, { id: 'session' })
})

for (const missing of [true, false]) {
  test(`rejects a running VM with ${missing ? 'no' : 'an unattached'} CD before creating storage`, async () => {
    const { xo, xapi, calls, session } = fixture({ vbds: missing ? [] : ['cd'] })
    const call = xapi.call
    xapi.call = (method, ...args) =>
      method === 'VBD.get_record'
        ? Promise.resolve({ type: 'CD', empty: true, currently_attached: false })
        : call(method, ...args)
    await assert.rejects(attach.call(xo, { id: 'session' }), /Shut down the VM/)
    await session.cleanup()
    assert.ok(!calls.some(call => call[0] === 'target.listen'))
  })
}

test('creates a missing read-only CD while halted', async () => {
  const { xo, calls } = fixture({ powerState: 'Halted', vbds: [] })
  await attach.call(xo, { id: 'session' })
  const drive = calls.find(call => call[0] === 'VBD_create')[1]
  assert.equal(drive.type, 'CD')
  assert.equal(drive.mode, 'RO')
  assert.equal(drive.VDI, 'vdi')
  await disconnect.call(xo, { id: 'session' })
})

test('cleanup uses the replacement XAPI connection after a pool reconnects', async () => {
  const { xo, xapi, calls } = fixture()
  await attach.call(xo, { id: 'session' })
  const replacement = { call: xapi.call, callAsync: xapi.callAsync }
  xo.getXapi = () => replacement
  xapi.call = () => {
    throw new Error('stale disconnected connection')
  }
  await disconnect.call(xo, { id: 'session' })
  assert.ok(calls.some(([method]) => method === 'SR.forget'))
})

test('records ownership before introducing the SR', async () => {
  const { xo, session, calls } = fixture()
  xo.browserMedia.recovery = {
    async remember() {
      calls.push(['journal.write'])
    },
    async forget() {
      calls.push(['journal.remove'])
    },
  }
  await attach.call(xo, { id: 'session' })
  const methods = calls.map(([method]) => method)
  assert.ok(methods.indexOf('journal.write') < methods.indexOf('SR.introduce'))
  assert.deepEqual(calls.find(([method]) => method === 'SR.introduce')[7], { 'xo:browser-media': session.id })
  await disconnect.call(xo, { id: 'session' })
  assert.ok(
    calls.findIndex(([method]) => method === 'journal.remove') > calls.findIndex(([method]) => method === 'SR.forget')
  )
})
