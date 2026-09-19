import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BrowserMediaRecovery, forgetBrowserMediaSr } from './browser-media-recovery.mjs'

function fixture() {
  const journal = {}
  const calls = []
  let exists = true
  const xapi = {
    pool: { uuid: 'pool' },
    async call(method, ...args) {
      calls.push([method, ...args])
      switch (method) {
        case 'SR.get_by_uuid':
          if (!exists) throw Object.assign(new Error('missing'), { code: 'UUID_INVALID' })
          return 'sr'
        case 'SR.get_record':
          return { type: 'iscsi', sm_config: { 'xo:browser-media': 'session' } }
        case 'SR.get_VDIs':
          return ['vdi']
        case 'VDI.get_VBDs':
          return ['cd']
        case 'VBD.get_record':
          return { type: 'CD', VDI: 'vdi' }
        case 'SR.get_PBDs':
          return ['pbd']
        case 'PBD.get_currently_attached':
          return true
        case 'SR.forget':
          exists = false
      }
    },
    callAsync(method, ...args) {
      return this.call(method, ...args)
    },
  }
  const xo = {
    _redis: {
      async hSet(key, uuid, value) {
        journal[uuid] = value
      },
      async hGetAll() {
        return { ...journal }
      },
      async hDel(key, uuid) {
        delete journal[uuid]
      },
    },
    getAllXapis: () => ({ server: xapi }),
  }
  const media = { sessions: new Map() }
  return { xo, media, xapi, journal, calls, recovery: new BrowserMediaRecovery(xo, media) }
}

test('a new process recovers journaled storage and tolerates a lost SR.forget reply', async () => {
  const { xo, media, xapi, journal, calls, recovery } = fixture()
  await recovery.remember({ id: 'session' }, xapi, 'uuid')
  const call = xapi.call.bind(xapi)
  xapi.call = async (method, ...args) => {
    const result = await call(method, ...args)
    if (method === 'SR.forget') throw new Error('lost reply')
    return result
  }
  const restarted = new BrowserMediaRecovery(xo, media)
  await restarted.reconcile()
  assert.ok(journal.uuid)
  await restarted.reconcile()
  assert.deepEqual(journal, {})
  const methods = calls.map(call => call[0])
  assert.ok(methods.indexOf('VBD.eject') < methods.indexOf('PBD.unplug'))
  assert.ok(!methods.includes('VDI.destroy'))
  assert.ok(!methods.includes('SR.destroy'))
})

test('active sessions and other pools are not reconciled', async () => {
  const { recovery, media, xapi, journal, calls } = fixture()
  await recovery.remember({ id: 'session' }, xapi, 'active')
  await recovery.remember({ id: 'other' }, { pool: { uuid: 'offline-pool' } }, 'offline')
  media.sessions.set('session', {})
  await recovery.reconcile()
  assert.equal(Object.keys(journal).length, 2)
  assert.deepEqual(calls, [])
})

test('unavailable hosts retain their journal entry and retry on reconnection', async () => {
  const { recovery, xapi, journal, calls } = fixture()
  await recovery.remember({ id: 'session' }, xapi, 'uuid')
  const call = xapi.call.bind(xapi)
  xapi.call = (method, ...args) => {
    if (method === 'PBD.unplug') throw new Error('host offline')
    return call(method, ...args)
  }
  await recovery.reconcile()
  assert.ok(journal.uuid)
  assert.ok(!calls.some(([method]) => method === 'SR.forget'))
  xapi.call = call
  await recovery.reconcile()
  assert.deepEqual(journal, {})
})

for (const replacement of [true, false]) {
  test(`refuses cleanup when ${replacement ? 'ownership changed' : 'the LUN backs a disk'}`, async () => {
    const { xapi, calls } = fixture()
    const call = xapi.call.bind(xapi)
    xapi.call = (method, ...args) => {
      if (replacement && method === 'SR.get_record') return { type: 'iscsi', sm_config: {} }
      if (!replacement && method === 'VBD.get_record') return { type: 'Disk', VDI: 'vdi' }
      return call(method, ...args)
    }
    await assert.rejects(forgetBrowserMediaSr(xapi, 'uuid', 'session'), /ownership|non-CD/)
    assert.ok(!calls.some(([method]) => method === 'VBD.eject' || method === 'SR.forget'))
  })
}
