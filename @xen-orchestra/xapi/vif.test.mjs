import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

import Vif from './vif.mjs'

function createXapi(record) {
  const calls = []
  const xapi = {
    pool: { uuid: 'pool-1' },
    async call(method) {
      calls.push(method)
      return method === 'VIF.create' ? 'OpaqueRef:vif-1' : undefined
    },
    async callAsync(method) {
      calls.push(method)
    },
    async getField(type, ref, field) {
      return field === 'power_state' ? 'Running' : 1500
    },
    async getRecord() {
      calls.push('getRecord')
      return record
    },
  }
  return { calls, xapi }
}

const params = { device: '0', network: 'OpaqueRef:network-1', VM: 'OpaqueRef:vm-1' }

describe('Vif.create', () => {
  it('destroys the VIF before it is plugged when the pool ignores trunks', async () => {
    // the record of a XAPI without VLAN filtering has no `trunks`
    const { calls, xapi } = createXapi({})

    await assert.rejects(Vif.prototype.create.call(xapi, { ...params, trunks: [10] }), error =>
      invalidParameters.is(error, { errors: [{ field: 'trunks' }] })
    )
    assert.deepEqual(calls, ['VIF.create', 'getRecord', 'VIF.destroy'])
  })

  it('keeps the VIF when the pool honours trunks', async () => {
    const { calls, xapi } = createXapi({ trunks: [10] })

    assert.equal(await Vif.prototype.create.call(xapi, { ...params, trunks: [10] }), 'OpaqueRef:vif-1')
    assert.deepEqual(calls, ['VIF.create', 'getRecord', 'VIF.plug'])
  })

  it('does not read the record when no trunks are asked', async () => {
    const { calls, xapi } = createXapi({})

    await Vif.prototype.create.call(xapi, params)
    assert.deepEqual(calls, ['VIF.create', 'VIF.plug'])
  })
})
