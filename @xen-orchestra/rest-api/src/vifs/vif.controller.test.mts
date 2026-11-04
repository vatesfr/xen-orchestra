import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'
import type { EditVifProps } from '@vates/types'

import { VifController } from './vif.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

// the VIF sits on a network whose PIF has a VLAN, where XAPI refuses trunks
const objects: Record<string, object> = {
  'network-1': { id: 'network-1', $pool: 'pool-1', PIFs: ['pif-1'] },
  'pif-1': { id: 'pif-1', vlan: 20 },
  'vif-1': { id: 'vif-1', $network: 'network-1', $pool: 'pool-1' },
  'vm-1': { id: 'vm-1', $pool: 'pool-1' },
}

function createController() {
  const xapiCalls: unknown[] = []
  const record =
    (method: string) =>
    async (...args: unknown[]) => {
      xapiCalls.push([method, ...args])
    }
  const restApi = {
    getObject: (id: string) => objects[id],
    getXapiObject: () => ({ $call: record('$call') }),
    xoApp: {
      allocIpAddresses: record('allocIpAddresses'),
      getXapi: () => ({ editVif: record('editVif'), VIF_create: record('VIF_create') }),
    },
  } as unknown as RestApi
  // the alarm service is not used by these routes
  const controller = new VifController(restApi, {} as never)
  return { controller, xapiCalls }
}

describe('VifController trunks', () => {
  it('refuses trunks on a network with a VLAN before any XAPI call', async () => {
    const { controller, xapiCalls } = createController()

    await assert.rejects(controller.updateVif('vif-1', { trunks: [10] }), invalidParameters.is)
    await assert.rejects(controller.putVifTrunk('vif-1', 10), invalidParameters.is)
    await assert.rejects(
      controller.createVif({ networkId: 'network-1', vmId: 'vm-1', trunks: [10] }),
      invalidParameters.is
    )

    assert.deepEqual(xapiCalls, [])
  })

  it('clears trunks on a network with a VLAN', async () => {
    const { controller, xapiCalls } = createController()

    await controller.updateVif('vif-1', { trunks: [] })

    assert.equal(xapiCalls.length, 1)
    const [method, vifId, props] = xapiCalls[0] as [string, string, EditVifProps]
    assert.equal(method, 'editVif')
    assert.equal(vifId, 'vif-1')
    assert.deepEqual(props.trunks, [])
  })
})
