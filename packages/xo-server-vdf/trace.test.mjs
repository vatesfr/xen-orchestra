import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import { enforcementOf, trace, vmAddresses } from './trace.mjs'

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
        networks: {
          '0/ipv4/0': '10.0.0.99',
          '1/ipv4/0': '10.0.1.5',
          '2/ipv4/0': '10.0.2.5',
          '1/ipv6/0': 'fe80::1',
          // fe80::/10, not only fe80::/16
          '1/ipv6/1': 'fea0::1',
        },
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

// An end given as an address sets the family, whichever end it is: a VM
// named by uuid, traced to an IPv6 outsider, takes its IPv6 address (the
// demo's vdf-app to a LAN device failed with "not of the same family")
describe('trace: the family of an end given as an address', () => {
  const vm = {
    $type: 'VM',
    uuid: 'vm-app',
    name_label: 'app',
    power_state: 'Running',
    resident_on: 'host-ref',
    $resident_on: { name_label: 'host', other_config: {} },
    $VIFs: [
      {
        uuid: 'vif-app',
        device: '0',
        MAC: '02:00:00:00:00:02',
        network: 'net-ref',
        locking_mode: 'unlocked',
        ipv4_allowed: [],
        ipv6_allowed: [],
      },
    ],
    $guest_metrics: { networks: { '0/ipv4/0': '10.0.0.2', '0/ipv6/0': 'fe80::2', '0/ipv6/1': '2001:db8::2' } },
  }
  const xapi = { objects: { all: { 'vm-ref': vm } }, getObjectByRef: () => undefined }
  const hops = []
  const callHop = async (ref, args) => {
    hops.push(args)
    return { delivered: true, policy_allowed: true, host: 'host', side: args.side, l2: '' }
  }
  const run = args => {
    hops.length = 0
    return trace(xapi, { proto: 'tcp', port: 443, ...args }, callHop)
  }

  test('a VM to an IPv6 outsider traces from its IPv6 address', async () => {
    const result = await run({ from: 'vm-app', to: '2001:db8::99' })
    assert.equal(result.from.ip, '2001:db8::2')
    assert.equal(hops[0].family, '6')
    assert.equal(hops[0].fromip, '2001:db8::2')
  })

  test('an IPv6 outsider to a VM traces to its IPv6 address', async () => {
    const result = await run({ from: '2001:db8::99', to: 'vm-app' })
    assert.equal(result.to.ip, '2001:db8::2')
  })

  test('a VM to an IPv4 outsider, and a VM alone, take its IPv4 address', async () => {
    assert.equal((await run({ from: 'vm-app', to: '192.0.2.9' })).from.ip, '10.0.0.2')
    assert.equal((await run({ from: 'vm-app', to: 'vm-app' })).from.ip, '10.0.0.2')
  })

  test('two addresses of different families are still refused', async () => {
    await assert.rejects(run({ from: '10.0.0.2', to: '2001:db8::99' }), /not of the same family/)
  })
})
