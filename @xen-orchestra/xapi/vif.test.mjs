import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

import Vif from './vif.mjs'

describe('Vif.create', () => {
  it('destroys the VIF before it is plugged when the pool ignores trunks', async () => {
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
      // the record of a XAPI without VLAN filtering has no `trunks`
      async getRecord() {
        return {}
      },
    }

    await assert.rejects(
      Vif.prototype.create.call(xapi, {
        device: '0',
        network: 'OpaqueRef:network-1',
        trunks: [10],
        VM: 'OpaqueRef:vm-1',
      }),
      error => invalidParameters.is(error, { errors: [{ field: 'trunks' }] })
    )
    assert.deepEqual(calls, ['VIF.create', 'VIF.destroy'])
  })
})
