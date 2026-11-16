import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

import { set } from './vif.mjs'

const vif = {
  id: 'vif-1',
  _xapiId: 'vif-1',
  allowedIpv4Addresses: [],
  allowedIpv6Addresses: [],
  attached: true,
  device: '0',
  lockingMode: 'network_default',
  MAC: 'aa:bb:cc:dd:ee:ff',
  MTU: 1500,
  other_config: {},
  trunks: [10],
  $network: 'network-1',
  $VM: 'vm-1',
}

function createContext(networkPifs) {
  const calls = []
  const xapi = {
    async callAsync(method) {
      calls.push([method])
    },
    async deleteVif() {
      calls.push(['deleteVif'])
    },
    getObject: id => ({ $PIFs: id === 'network-2' ? networkPifs : [], $ref: `ref:${id}` }),
    async VIF_create(params) {
      calls.push(['VIF_create', params])
      return 'ref:vif-2'
    },
    async _getOrWaitObject() {
      return { $id: 'vif-2' }
    },
  }
  const app = {
    apiContext: { permission: 'admin' },
    allocIpAddresses: async () => {},
    getXapi: () => xapi,
  }
  return { app, calls }
}

describe('vif.set', () => {
  it('refuses to move a VIF with trunks to a network with a VLAN, before touching the VIF', async () => {
    const { app, calls } = createContext([{ VLAN: '100' }])

    await assert.rejects(set.call(app, { vif, network: { id: 'network-2', _xapiRef: 'ref:network-2' } }), error =>
      invalidParameters.is(error)
    )
    assert.deepEqual(calls, [])
  })

  it('keeps the trunks when a MAC change recreates the VIF', async () => {
    const { app, calls } = createContext([])

    assert.equal(await set.call(app, { vif, mac: '11:22:33:44:55:66' }), 'vif-2')

    const create = calls.find(([method]) => method === 'VIF_create')
    assert.deepEqual(create[1].trunks, [10])
  })
})
