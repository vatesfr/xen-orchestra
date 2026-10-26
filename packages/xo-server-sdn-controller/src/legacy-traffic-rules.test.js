import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { LegacyTrafficRules } from './legacy-traffic-rules.js'

const SSH = { allow: false, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/8', direction: 'to' }

// A controller recording the legacy methods called, with their arguments
function setup() {
  const calls = []
  const record =
    name =>
    async (...args) => {
      calls.push([name, ...args])
    }
  const controller = {}
  for (const name of [
    '_addRule',
    '_addNetworkRule',
    '_deleteRule',
    '_deleteNetworkOfRule',
    '_applyVifOfRules',
    '_applyNetworkOfRules',
    '_cleanVifOfRules',
    '_cleanNetworkOfRules',
  ]) {
    controller[name] = record(name)
  }
  const network = { uuid: 'net', $type: 'network' }
  const vif = { uuid: 'vif', $type: 'VIF', $network: network }
  network.$VIFs = [vif]
  return { calls, network, vif, trafficRules: new LegacyTrafficRules(controller) }
}

describe('LegacyTrafficRules', () => {
  it('calls the legacy method of the network or of the VIF, and returns no rank', async () => {
    const { calls, network, vif, trafficRules } = setup()

    assert.equal(await trafficRules.addRule(network, SSH), undefined)
    await trafficRules.deleteRule(vif, SSH)
    assert.equal(await trafficRules.updateRule(vif, SSH, { ...SSH, allow: true, priority: null }), undefined)

    assert.deepEqual(calls, [
      ['_addNetworkRule', { ...SSH, networkId: 'net' }],
      ['_deleteRule', { ...SSH, vifId: 'vif' }],
      ['_deleteRule', { ...SSH, vifId: 'vif' }],
      ['_addRule', { ...SSH, allow: true, priority: null, vifId: 'vif' }],
    ])
  })

  it('cleans the rules of a VIF before it goes down, and applies them once it is back', async () => {
    const { calls, network, vif, trafficRules } = setup()

    await trafficRules.vifDetaching(vif)
    await trafficRules.vifDetached(vif)
    await trafficRules.vifAttached(vif)
    await trafficRules.refresh(network)

    assert.deepEqual(
      calls.map(([name]) => name),
      [
        '_cleanNetworkOfRules',
        '_applyNetworkOfRules',
        '_cleanVifOfRules',
        '_applyVifOfRules',
        '_applyNetworkOfRules',
        // on connection, only the VIF rules
        '_applyVifOfRules',
      ]
    )
  })
})
