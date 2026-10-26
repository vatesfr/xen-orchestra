import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import { vmAddresses } from './trace.mjs'

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
