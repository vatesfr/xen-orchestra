import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import { enforcementOf, vmAddresses } from './trace.mjs'

// a trace's ends resolve addresses as agents count them (vdf#36)
describe('trace: a VM addresses', () => {
  const vif = fields => ({
    device: '0',
    locking_mode: 'network_default',
    ipv4_allowed: [],
    ipv6_allowed: [],
    ...fields,
  })

  test('per VIF: locked, guest-reported for its device, nothing when disabled', () => {
    const vm = {
      $guest_metrics: {
        networks: { '0/ipv4/0': '10.0.0.99', '1/ipv4/0': '10.0.1.5', '2/ipv4/0': '10.0.2.5', '1/ipv6/0': 'fe80::1' },
      },
    }
    const vifs = [
      vif({ locking_mode: 'locked', ipv4_allowed: ['10.0.0.5'] }),
      vif({ device: '1', locking_mode: 'unlocked' }),
      vif({ device: '2', $network: { default_locking_mode: 'disabled' } }),
    ]
    assert.deepEqual(vmAddresses(vm, vifs), { ipv4: ['10.0.0.5', '10.0.1.5'], ipv6: [] })
  })

  test('an address reported for a device the VM has no VIF for counts nowhere', () => {
    const vm = { $guest_metrics: { networks: { '0/ipv4/0': '10.0.0.5', '7/ipv4/0': '10.9.9.9' } } }
    assert.deepEqual(vmAddresses(vm, [vif({ locking_mode: 'locked', ipv4_allowed: ['10.0.0.5'] })]), {
      ipv4: ['10.0.0.5'],
      ipv6: [],
    })
    assert.deepEqual(vmAddresses(vm, []), { ipv4: [], ipv6: [] })
  })
})

// vdf#41: a VIF locked by VDF counts as locked while the agent of the VM's
// host lists it as enforced, as in the global sync
describe('trace: a VM locked by VDF', () => {
  const status = locking =>
    JSON.stringify({
      heartbeat: new Date().toISOString(),
      heartbeatSec: 30,
      locking: { vdfLock: true, vdfEnforcedAllowed: { 'vif-1': ['10.0.0.5'] }, ...locking },
    })
  const vmOn = (locking, { live = true, power = 'Running' } = {}) => ({
    power_state: power,
    $resident_on: { other_config: { 'vdf:status': status(locking) }, $metrics: { live } },
    $guest_metrics: { networks: { '0/ipv4/0': '10.0.0.5', '0/ipv4/1': '10.0.0.99' } },
  })
  const vif = {
    uuid: 'vif-1',
    device: '0',
    locking_mode: 'network_default',
    ipv4_allowed: ['10.0.0.5'],
    ipv6_allowed: [],
    other_config: { 'vdf:locking': 'locked' },
  }
  const ipv4 = vm => vmAddresses(vm, [vif]).ipv4

  test("its allowed addresses while enforced, the guest's otherwise", () => {
    assert.deepEqual(ipv4(vmOn({ vdfEnforced: ['vif-1'] })), ['10.0.0.5'])
    // its gate still enforces the previous address: a change pending
    assert.deepEqual(ipv4(vmOn({ vdfEnforced: ['vif-1'], vdfEnforcedAllowed: { 'vif-1': ['10.0.0.4'] } })), [
      '10.0.0.5',
      '10.0.0.99',
    ])
    assert.deepEqual(ipv4(vmOn({ vdfEnforced: [] })), ['10.0.0.5', '10.0.0.99'])
    assert.deepEqual(ipv4(vmOn({ vdfEnforced: ['vif-1'] }, { live: false })), ['10.0.0.5', '10.0.0.99'])
    assert.deepEqual(ipv4(vmOn({ vdfEnforced: ['vif-1'] }, { power: 'Halted' })), ['10.0.0.5', '10.0.0.99'])
    assert.deepEqual(ipv4({ ...vmOn({ vdfEnforced: ['vif-1'] }), $resident_on: undefined }), ['10.0.0.5', '10.0.0.99'])
    // no metrics: not known live
    const noMetrics = vmOn({ vdfEnforced: ['vif-1'] })
    delete noMetrics.$resident_on.$metrics
    assert.deepEqual(ipv4(noMetrics), ['10.0.0.5', '10.0.0.99'])
    assert.equal(enforcementOf(vmOn({ vdfEnforced: 'vif-1' })), undefined)
  })
})
