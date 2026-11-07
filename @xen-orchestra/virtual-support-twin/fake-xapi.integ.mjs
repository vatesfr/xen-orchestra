import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { Xapi } from 'xen-api'

import { createFakeXapi } from './fake-xapi.mjs'

describe('createFakeXapi()', () => {
  const recordsByType = {
    pool: { 'OpaqueRef:pool': { uuid: 'pool-uuid', name_label: 'pool', master: 'OpaqueRef:host', other_config: {} } },
    host: { 'OpaqueRef:host': { uuid: 'host-uuid', name_label: 'host', address: '127.0.0.1' } },
    VM: { 'OpaqueRef:vm': { uuid: 'vm-uuid', name_label: 'my VM', power_state: 'Halted' } },
  }

  let fakeXapi, xapi
  before(async () => {
    fakeXapi = await createFakeXapi(recordsByType)
    xapi = new Xapi({ auth: { user: 'root', password: 'any' }, url: fakeXapi.url, allowUnauthorized: true })
    await xapi.connect()
    await xapi.objectsFetched
  })
  after(async () => {
    await xapi.disconnect()
    await fakeXapi.close()
  })

  it('lets xen-api connect and fetch all records', () => {
    assert.equal(xapi.pool.name_label, 'pool')
    assert.equal(xapi.objects.indexes.type.VM['vm-uuid'].name_label, 'my VM')
    assert.equal(xapi.getObjectByRef('OpaqueRef:host').name_label, 'host')
  })

  it('serves single records', async () => {
    assert.equal((await xapi.getRecord('VM', 'OpaqueRef:vm')).power_state, 'Halted')
  })

  it('rejects other methods with a XAPI error', async () => {
    await assert.rejects(xapi.call('VM.start', 'OpaqueRef:vm', false, false), { code: 'MESSAGE_METHOD_UNKNOWN' })
  })
})
