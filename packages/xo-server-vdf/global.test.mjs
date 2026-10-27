import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  addressOverlaps,
  checkGlobalDocument,
  checkLocalDocument,
  compose,
  duplicateAddresses,
  GLOBAL_RULE_BASE,
  globalMembers,
  hostStatus,
  isFresh,
  keepGlobalPart,
  localPart,
  memberConflicts,
  OWNER_KEY,
  poolOwner,
  poolSyncState,
  remoteIpsFor,
  reservedTierPolicies,
  runningVmRecords,
  vdfLockEnforcement,
  vmIfaces,
  vmIps,
  withFormatVersion,
} from './global.mjs'

const GLOBAL = {
  groups: {
    admins: { ips: ['192.0.2.30'] },
    db: { tags: ['vdf:role=db'] },
    app: { tags: ['vdf:role=app'] },
  },
  policies: [
    {
      name: 'db',
      tier: 'securityops',
      appliedTo: 'db',
      default: 'pass',
      ingress: [
        { id: 1, from: 'app', proto: 'tcp', ports: [5432] },
        { id: 2, action: 'drop', from: 'any', proto: 'tcp', ports: [5432] },
      ],
    },
  ],
}

const LOCAL = {
  groups: { web: { tags: ['vdf:role=web'] } },
  policies: [
    {
      name: 'web',
      appliedTo: 'web',
      default: 'drop',
      ingress: [{ id: 1, from: 'global:admins', proto: 'tcp', ports: [22] }],
    },
  ],
  limits: { maxConnPerVIF: 5000 },
}

describe('compose', () => {
  test('version 4 when a policy, global or local, is in monitor mode (vdf#13)', () => {
    const local = {
      groups: { db: { tags: ['role=db'] } },
      policies: [{ name: 'db', appliedTo: 'db', default: 'drop', ingress: [] }],
    }
    const global = {
      groups: { app: { tags: ['role=app'] } },
      policies: [{ name: 'app', mode: 'monitor', appliedTo: 'app', default: 'drop', ingress: [] }],
    }
    assert.equal(compose(local, global).version, 4)
    assert.equal(compose(local, null).version, undefined)
    assert.equal(compose({ ...local, version: 4 }, null).version, undefined)
    assert.equal(compose({ ...local, policies: [{ ...local.policies[0], mode: 'monitor' }] }, null).version, 4)
  })

  test('egress rules: global ids and destination names (vdf#53)', () => {
    const global = {
      groups: { app: { tags: ['role=app'] }, db: { tags: ['role=db'] } },
      policies: [
        {
          name: 'app',
          appliedTo: 'app',
          default: 'pass',
          ingress: [],
          egressDefault: 'drop',
          egress: [
            { id: 1, to: 'db', proto: 'tcp', ports: [5432] },
            { id: 2, to: 'any', proto: 'udp', ports: [53] },
          ],
        },
      ],
    }
    const [policy] = compose({ groups: {}, policies: [] }, global).policies
    assert.deepEqual(
      policy.egress.map(rule => [rule.id, rule.to]),
      [
        [GLOBAL_RULE_BASE + 1, 'global:db'],
        [GLOBAL_RULE_BASE + 2, 'any'],
      ]
    )
    assert.equal(policy.egressDefault, 'drop')
    assert.equal('from' in policy.egress[0], false)
    // ids checked in both directions
    assert.equal(
      checkGlobalDocument({
        ...global,
        policies: [{ ...global.policies[0], egress: [{ id: 0, to: 'db', proto: 'tcp' }] }],
      }).length,
      1
    )
  })

  test('port ranges kept as written (vdf#54)', () => {
    const global = {
      groups: { app: { tags: ['role=app'] } },
      policies: [
        {
          name: 'app',
          appliedTo: 'app',
          default: 'drop',
          ingress: [{ id: 1, from: 'any', proto: 'tcp', ports: [22, '8000-8099'] }],
        },
      ],
    }
    const document = compose({ groups: {}, policies: [] }, global)
    assert.deepEqual(document.policies[0].ingress[0].ports, [22, '8000-8099'])
    assert.equal(document.version, undefined) // agents tell version 5 from the strings
  })

  test('global objects first, prefixed, rule ids offset, local part kept', () => {
    const document = compose(LOCAL, GLOBAL, { app: ['10.1.0.5'] })

    assert.deepEqual(Object.keys(document.groups), ['global:admins', 'global:db', 'global:app', 'web'])
    assert.deepEqual(document.groups['global:app'], { tags: ['vdf:role=app'], ips: ['10.1.0.5'] })
    assert.deepEqual(document.groups['global:admins'], { ips: ['192.0.2.30'] })
    assert.deepEqual(
      document.policies.map(policy => policy.name),
      ['global:db', 'web']
    )
    const [db] = document.policies
    assert.equal(db.appliedTo, 'global:db')
    assert.deepEqual(
      db.ingress.map(rule => [rule.id, rule.from]),
      [
        [GLOBAL_RULE_BASE + 1, 'global:app'],
        [GLOBAL_RULE_BASE + 2, 'any'],
      ]
    )
    assert.deepEqual(document.limits, { maxConnPerVIF: 5000 })
  })

  test('recomposing replaces what XO wrote before, whatever the pool holds', () => {
    const stale = compose(LOCAL, { groups: { old: { tags: ['x'] } }, policies: [] })
    stale.groups['global:forged'] = { tags: ['y'] }

    const document = compose(stale, GLOBAL)

    assert.equal(document.groups['global:old'], undefined)
    assert.equal(document.groups['global:forged'], undefined)
    assert.deepEqual(localPart(document), localPart(LOCAL))
  })

  test('out of scope: the local part only', () => {
    assert.deepEqual(compose(compose(LOCAL, GLOBAL), null), localPart(LOCAL))
  })
})

describe('checks', () => {
  test('global names and ids', () => {
    assert.deepEqual(checkGlobalDocument(GLOBAL), [])
    assert.equal(
      checkGlobalDocument({
        groups: { 'global:x': {} },
        policies: [{ name: 'p', ingress: [{ id: GLOBAL_RULE_BASE }] }],
      }).length,
      2
    )
  })

  test('local ids stay below the global range', () => {
    assert.deepEqual(checkLocalDocument(compose(LOCAL, GLOBAL)), [])
    assert.equal(
      checkLocalDocument({ groups: {}, policies: [{ name: 'p', ingress: [{ id: GLOBAL_RULE_BASE + 3 }] }] }).length,
      1
    )
  })

  // vdf#21: a pool's emergency allow would decide before a global drop
  test('in scope, a local policy in a tier kept for global policies is refused', () => {
    const local = tier => ({ groups: {}, policies: [{ name: `p-${tier}`, tier, appliedTo: 'web', ingress: [] }] })
    for (const tier of ['emergency', 'securityops', 0, 10, 25]) {
      const errors = checkLocalDocument(local(tier), { globalScope: true })
      assert.equal(errors.length, 1, String(tier))
      assert.match(errors[0], new RegExp(`move "p-${tier}" to networkops or a later tier`))
    }
    for (const tier of ['networkops', 'platform', 26, undefined, 'baseline']) {
      assert.deepEqual(checkLocalDocument(local(tier), { globalScope: true }), [], String(tier))
    }
    // out of scope: every tier
    assert.deepEqual(checkLocalDocument(local('emergency')), [])
    // the global policies themselves (securityops in GLOBAL) may use any
    assert.deepEqual(checkLocalDocument(compose(LOCAL, GLOBAL), { globalScope: true }), [])
    assert.deepEqual(
      reservedTierPolicies(
        compose({ ...LOCAL, policies: [...LOCAL.policies, { ...LOCAL.policies[0], name: 'sos', tier: 0 }] }, GLOBAL)
      ),
      ['sos']
    )
  })
})

describe('members', () => {
  const vms = [
    {
      id: 'a1',
      name_label: 'app-1',
      $pool: 'A',
      power_state: 'Running',
      tags: ['vdf:role=app'],
      addresses: { '0/ipv4/0': '10.0.0.5' },
    },
    {
      id: 'b1',
      name_label: 'app-2',
      $pool: 'B',
      power_state: 'Running',
      tags: ['vdf:role=app'],
      addresses: { '0/ipv4/0': '10.1.0.9' },
    },
    { id: 'b2', name_label: 'app-3', $pool: 'B', power_state: 'Halted', tags: ['vdf:role=app'], addresses: {} },
    {
      id: 'c1',
      name_label: 'app-4',
      $pool: 'C',
      power_state: 'Running',
      tags: ['vdf:role=app'],
      addresses: { '0/ipv4/0': '10.2.0.1' },
    },
    {
      id: 'b3',
      name_label: 'db-1',
      $pool: 'B',
      power_state: 'Running',
      tags: ['vdf:role=db'],
      addresses: { '0/ipv4/0': '6.6.6.6' },
    },
  ]
  const vifs = {
    b3: [
      {
        device: '0',
        lockingMode: 'locked',
        allowedIpv4Addresses: ['10.1.0.20'],
        allowedIpv6Addresses: ['fd00::20', 'fe80::1'],
      },
    ],
  }
  // one VIF each, unlocked, unless said otherwise
  const vifsOf = vm => vifs[vm.id] ?? [{ device: '0', lockingMode: 'network_default' }]
  const records = runningVmRecords(vms, vifsOf)
  const scope = { pools: ['A', 'B'] }

  test('running members of the pools in scope, locked IPs authoritative', () => {
    const members = globalMembers({ global: GLOBAL, records, scope })

    assert.deepEqual(
      members.app.map(member => member.vm),
      ['a1', 'b1']
    )
    assert.deepEqual(members.db, [
      { vm: 'b3', vmName: 'db-1', pool: 'B', ips: ['10.1.0.20', 'fd00::20'], trusted: true },
    ])
    assert.deepEqual(members.admins, [])
  })

  test("a pool gets the other pools' members only", () => {
    const members = globalMembers({ global: GLOBAL, records, scope })

    assert.deepEqual(remoteIpsFor('A', members), { admins: [], app: ['10.1.0.9'], db: ['10.1.0.20', 'fd00::20'] })
    assert.deepEqual(remoteIpsFor('B', members).app, ['10.0.0.5'])
  })

  test('an IP another VM holds too is left out of the other pools, the overlap reported', () => {
    // a VM of pool C took app-2's address, and pool A has a VM numbered like one of B's
    const withReuse = [
      ...records,
      { vm: 'c2', vmName: 'dhcp-client', pool: 'C', tags: [], ips: ['10.1.0.9'], trusted: false },
      { vm: 'a2', vmName: 'twin', pool: 'A', tags: [], ips: ['10.1.0.20'], trusted: false },
    ]
    const members = globalMembers({ global: GLOBAL, records: withReuse, scope })
    const duplicates = duplicateAddresses(withReuse)
    const conflicts = memberConflicts(members, duplicates)

    assert.deepEqual(
      conflicts.map(conflict => [
        conflict.group,
        conflict.ip,
        conflict.member.vm,
        conflict.holders.map(holder => holder.vm),
      ]),
      [
        ['db', '10.1.0.20', 'b3', ['a2']],
        ['app', '10.1.0.9', 'b1', ['c2']],
      ]
    )
    assert.deepEqual(remoteIpsFor('A', members, conflicts), { admins: [], app: [], db: ['fd00::20'] })
    // pool C is out of scope: only A and B overlap
    assert.deepEqual(
      addressOverlaps(duplicates, scope).map(overlap => [overlap.ip, overlap.holders.map(holder => holder.pool)]),
      [['10.1.0.20', ['B', 'A']]]
    )
  })

  test('members of a group may share an IP', () => {
    const shared = [
      { vm: 'x', vmName: 'x', pool: 'A', tags: ['vdf:role=app'], ips: ['10.9.0.1'], trusted: false },
      { vm: 'y', vmName: 'y', pool: 'B', tags: ['vdf:role=app'], ips: ['10.9.0.1'], trusted: false },
    ]
    const members = globalMembers({ global: GLOBAL, records: shared, scope })
    assert.deepEqual(memberConflicts(members, duplicateAddresses(shared)), [])
  })

  test('guest IPs when no VIF is locked', () => {
    assert.deepEqual(
      vmIps({ addresses: { '0/ipv4/0': '10.0.0.1', '0/ipv6/0': 'fe80::2', '0/ipv6/1': 'fd00::2' } }, [
        { device: '0', lockingMode: 'unlocked' },
      ]),
      {
        ips: ['10.0.0.1', 'fd00::2'],
        trusted: false,
      }
    )
  })

  // the agent's red-team fix (vdf b6846f8): the guest writes these keys
  test('addresses reported for a device the VM has no VIF for count nowhere', () => {
    const locked = {
      id: 'l1',
      name_label: 'locked-1',
      $pool: 'A',
      power_state: 'Running',
      tags: ['vdf:role=app'],
      addresses: { '0/ipv4/0': '10.0.0.5', '7/ipv4/0': '10.9.9.9' },
    }
    const lockedVifs = [{ device: '0', lockingMode: 'locked', allowedIpv4Addresses: ['10.0.0.5'] }]
    assert.deepEqual(vmIps(locked, lockedVifs), { ips: ['10.0.0.5'], trusted: true })
    const members = globalMembers({
      global: GLOBAL,
      records: runningVmRecords([locked], () => lockedVifs),
      scope: { all: true },
    })
    assert.deepEqual(members.app, [{ vm: 'l1', vmName: 'locked-1', pool: 'A', ips: ['10.0.0.5'], trusted: true }])
    // nor does a VM without any VIF
    assert.deepEqual(vmIps(locked, []), { ips: [], trusted: false })
  })
})

describe('per-network groups (vdf#36)', () => {
  const dmz = { id: 'n-dmz', tags: ['vdf:net=dmz'] }
  const backend = { id: 'n-backend', tags: ['vdf:net=backend'] }
  const networks = { 'n-dmz': dmz, 'n-backend': backend }
  const networkOf = vif => networks[vif.$network]
  const web = {
    id: 'web',
    name_label: 'web',
    $pool: 'A',
    power_state: 'Running',
    tags: ['vdf:role=web'],
    addresses: { '0/ipv4/0': '10.0.20.5', '1/ipv4/0': '10.0.30.99', '2/ipv4/0': '192.0.2.7' },
  }
  const vifs = [
    { device: '0', $network: 'n-dmz', lockingMode: 'unlocked' },
    { device: '1', $network: 'n-backend', lockingMode: 'locked', allowedIpv4Addresses: ['10.0.30.5'] },
  ]

  test('each interface has its network tags and addresses', () => {
    // device 2 has no VIF: what the guest reports for it counts nowhere
    assert.deepEqual(vmIfaces(web, vifs, networkOf), [
      { device: '0', network: 'n-dmz', netTags: ['vdf:net=dmz'], ips: ['10.0.20.5'], trusted: false },
      // locked: the guest's address ignored
      { device: '1', network: 'n-backend', netTags: ['vdf:net=backend'], ips: ['10.0.30.5'], trusted: true },
    ])
    // the unlocked NIC's guest addresses count too, untrusted
    assert.deepEqual(vmIps(web, vifs, networkOf), { ips: ['10.0.20.5', '10.0.30.5'], trusted: false })
  })

  test('a disabled interface sends nothing: its guest addresses count nowhere', () => {
    const quiet = { id: 'n-quiet', tags: [], defaultIsLocked: true }
    const withQuiet = vif => (vif.$network === 'n-quiet' ? quiet : networkOf(vif))
    const disabledVifs = [
      { device: '0', $network: 'n-dmz', lockingMode: 'disabled' },
      // the network's default locking mode is disabled
      { device: '1', $network: 'n-quiet', lockingMode: 'network_default' },
    ]
    const vm = { ...web, addresses: { '0/ipv4/0': '10.0.20.5', '1/ipv4/0': '10.0.40.5' } }
    assert.deepEqual(
      vmIfaces(vm, disabledVifs, withQuiet).map(iface => iface.ips),
      [[], []]
    )
    assert.deepEqual(vmIps(vm, disabledVifs, withQuiet), { ips: [], trusted: false })
  })

  test("a group with networks gets its members' addresses there only", () => {
    const global = {
      groups: {
        web: { tags: ['vdf:role=web'] },
        'web-backend': { tags: ['vdf:role=web'], networks: ['vdf:net=backend'] },
        'web-admin': { tags: ['vdf:role=web'], networks: ['vdf:net=admin'] },
      },
      policies: [],
    }
    const records = [
      ...runningVmRecords([web], () => vifs, networkOf),
      // saved before interfaces were known: no member of a scoped group
      { vm: 'old', vmName: 'old', pool: 'B', tags: ['vdf:role=web'], ips: ['10.0.30.7'], trusted: true },
    ]
    const members = globalMembers({ global, records, scope: { all: true } })
    assert.deepEqual(
      members.web.map(member => member.ips),
      [['10.0.20.5', '10.0.30.5'], ['10.0.30.7']]
    )
    assert.deepEqual(members['web-backend'], [
      { vm: 'web', vmName: 'web', pool: 'A', ips: ['10.0.30.5'], trusted: true },
    ])
    assert.deepEqual(members['web-admin'], [])
    // composed for pool B: the remote addresses on the backend network only
    const composed = compose({ groups: {}, policies: [] }, global, remoteIpsFor('B', members))
    assert.deepEqual(composed.groups['global:web-backend'], {
      tags: ['vdf:role=web'],
      networks: ['vdf:net=backend'],
      ips: ['10.0.30.5'],
    })
  })
})

describe('poolSyncState', () => {
  const expected = compose(LOCAL, GLOBAL, { app: ['10.1.0.5'] })

  test('in sync, behind, not published', () => {
    assert.equal(poolSyncState({ inScope: true, published: JSON.parse(JSON.stringify(expected)), expected }), 'in-sync')
    assert.equal(poolSyncState({ inScope: true, published: compose(LOCAL, GLOBAL), expected }), 'behind')
    assert.equal(poolSyncState({ inScope: true, published: LOCAL, expected }), 'not-published')
    assert.equal(poolSyncState({ inScope: true, published: null, expected }), 'not-published')
  })

  test('out of scope, with or without a stale global part', () => {
    assert.equal(poolSyncState({ inScope: false, published: LOCAL, expected }), 'out-of-scope')
    assert.equal(poolSyncState({ inScope: false, published: expected, expected }), 'stale-global')
  })

  test('local edits are not drift', () => {
    const published = compose({ ...LOCAL, policies: [] }, GLOBAL, { app: ['10.1.0.5'] })
    assert.equal(poolSyncState({ inScope: true, published, expected }), 'in-sync')
  })
})

describe('ownership', () => {
  test("the owner XO, if the pool's entry is valid", () => {
    assert.deepEqual(poolOwner({ [OWNER_KEY]: '{"id":"xo-1","name":"xo"}' }), { id: 'xo-1', name: 'xo' })
    assert.equal(poolOwner({ [OWNER_KEY]: 'garbage' }), undefined)
    assert.equal(poolOwner({}), undefined)
  })

  test("another XO's global part is kept as is under the pool's edit", () => {
    const published = compose(LOCAL, GLOBAL, { app: ['10.1.0.5'] })
    const edited = { groups: {}, policies: [] }
    const kept = keepGlobalPart(edited, published)
    assert.deepEqual(Object.keys(kept.groups), ['global:admins', 'global:db', 'global:app'])
    assert.deepEqual(
      kept.policies.map(policy => policy.name),
      ['global:db']
    )
  })
})

describe('withFormatVersion (vdf#36)', () => {
  test('version 7 with a group scoped to networks, down again without', () => {
    const policies = [{ name: 'p', appliedTo: 'web', default: 'drop', ingress: [] }]
    const scoped = { groups: { web: { tags: ['vdf:role=web'], networks: ['vdf:net=dmz'] } }, policies }
    assert.equal(withFormatVersion(scoped).version, 7)
    assert.equal(
      'version' in withFormatVersion({ version: 7, groups: { web: { tags: ['vdf:role=web'] } }, policies }),
      false
    )
    assert.equal(withFormatVersion({ ...scoped, policies: [{ ...policies[0], mode: 'monitor' }] }).version, 7)
  })
})

// vdf#41: a VIF locked by VDF (other_config vdf:locking) counts as locked
// only while the agent of the VM's host lists it as enforced
describe('VDF locks', () => {
  const NOW = Date.parse('2026-10-27T12:00:00Z')
  const status = (locking, { heartbeat = '2026-10-27T11:59:30Z', heartbeatSec = 30 } = {}) => ({
    heartbeat,
    heartbeatSec,
    ...(locking === undefined ? {} : { locking }),
  })
  const LOCKING = {
    unlocked: 0,
    stale: 0,
    vdfLock: true,
    vdfLocked: 1,
    vdfEnforced: ['vif-1'],
    vdfUnenforced: [],
    vdfEnforcedAllowed: { 'vif-1': ['10.0.0.5'] },
  }
  const supporting = status(LOCKING)
  const vm = {
    id: 'vm-1',
    name_label: 'app-1',
    $pool: 'A',
    power_state: 'Running',
    tags: ['vdf:role=app'],
    // the guest claims another VM's address too
    addresses: { '0/ipv4/0': '10.0.0.5', '0/ipv4/1': '10.0.0.99' },
  }
  const vdfLocked = {
    id: 'vif-1',
    device: '0',
    lockingMode: 'network_default',
    allowedIpv4Addresses: ['10.0.0.5'],
    other_config: { 'vdf:locking': 'locked' },
  }
  const ipsOf = (vifs, hostStatus_, { now = NOW, live = true } = {}) =>
    vmIps(vm, vifs, undefined, vdfLockEnforcement(hostStatus_, { now, live }))
  const untrusted = { ips: ['10.0.0.5', '10.0.0.99'], trusted: false }
  const withLocking = fields => status({ ...LOCKING, ...fields })

  test('trusted, with its allowed addresses, while the agent lists it as enforced', () => {
    assert.deepEqual(ipsOf([vdfLocked], supporting), { ips: ['10.0.0.5'], trusted: true })
  })

  test('each failing condition makes it an unlocked interface', () => {
    // no key, or another value than locked
    assert.deepEqual(ipsOf([{ ...vdfLocked, other_config: {} }], supporting), untrusted)
    assert.deepEqual(ipsOf([{ ...vdfLocked, other_config: { 'vdf:locking': 'yes' } }], supporting), untrusted)
    // no agent status, or a host not running
    assert.deepEqual(ipsOf([vdfLocked], undefined), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], supporting, { live: false }), untrusted)
    // a stale heartbeat (twice its period): the agent is stopped or stuck
    assert.deepEqual(ipsOf([vdfLocked], supporting, { now: NOW + 31e3 }), untrusted)
    assert.equal(ipsOf([vdfLocked], supporting, { now: NOW + 29e3 }).trusted, true)
    // a heartbeat from the future says nothing about now (a little skew passes)
    assert.deepEqual(ipsOf([vdfLocked], supporting, { now: Date.parse('2026-10-27T11:57:00Z') }), untrusted)
    assert.equal(ipsOf([vdfLocked], supporting, { now: Date.parse('2026-10-27T11:59:00Z') }).trusted, true)
    // an agent before VDF locks
    assert.deepEqual(ipsOf([vdfLocked], status({ unlocked: 1, stale: 0 })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], status(undefined)), untrusted)
    // not listed as enforced: just locked, hot-plugged, just migrated here
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: ['vif-2'] })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: [], vdfUnenforced: ['vif-1'] })), untrusted)
    // a stop status: what it says no longer holds
    assert.deepEqual(ipsOf([vdfLocked], { ...supporting, stopping: '2026-10-27T11:59:40Z' }), untrusted)
    // no heartbeat period, or not a number: the agent's own rule
    assert.deepEqual(ipsOf([vdfLocked], { ...supporting, heartbeatSec: undefined }), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], { ...supporting, heartbeatSec: '30' }), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], { ...supporting, heartbeatSec: 0 }), untrusted)
    // a missing or malformed list enforces nothing
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: undefined })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: 'vif-1' })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: { 'vif-1': true } })), untrusted)
  })

  // the addresses its gate enforces now must be XAPI's: a hung agent may
  // still enforce the previous ones, given since to another VM
  test('trusted only while its gate enforces the addresses XAPI holds', () => {
    const v6 = { ...vdfLocked, allowedIpv6Addresses: ['2001:db8::5'] }
    const gate = allowed => withLocking({ vdfEnforcedAllowed: { 'vif-1': allowed } })
    // equal, whatever the order and the writing (case, zeros compressed or not)
    assert.equal(ipsOf([v6], gate(['10.0.0.5', '2001:db8::5'])).trusted, true)
    assert.equal(ipsOf([v6], gate(['2001:db8::5', '10.0.0.5'])).trusted, true)
    assert.equal(
      ipsOf([{ ...v6, allowedIpv6Addresses: ['2001:DB8:0:0::5'] }], gate(['10.0.0.5', '2001:db8::5'])).trusted,
      true
    )
    assert.equal(ipsOf([v6], gate(['10.0.0.5', '2001:0db8:0000::0005'])).trusted, true)
    // differing: the previous address, one more, one less
    assert.deepEqual(ipsOf([vdfLocked], gate(['10.0.0.4'])), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], gate(['10.0.0.5', '10.0.0.4'])), untrusted)
    assert.equal(ipsOf([v6], gate(['10.0.0.5'])).trusted, false)
    // no entry, no map, not an array, not strings
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforcedAllowed: {} })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforcedAllowed: undefined })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforcedAllowed: [['10.0.0.5']] })), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], gate('10.0.0.5')), untrusted)
    assert.deepEqual(ipsOf([vdfLocked], gate([167772165])), untrusted)
    // listed as enforced is needed too
    assert.deepEqual(ipsOf([vdfLocked], withLocking({ vdfEnforced: [] })), untrusted)
  })

  test('the lists are arrays of uuids or nothing', () => {
    // no list of those it enforces: an agent too old to vouch for any
    assert.equal(vdfLockEnforcement(withLocking({ vdfEnforced: 'vif-1' }), { now: NOW }), undefined)
    assert.equal(vdfLockEnforcement(withLocking({ vdfEnforced: undefined }), { now: NOW }), undefined)
    const enforcement = vdfLockEnforcement(withLocking({ vdfUnenforced: 'v' }), { now: NOW })
    assert.deepEqual([...enforcement.unenforced], [])
    const filtered = vdfLockEnforcement(withLocking({ vdfEnforced: ['vif-1', 7, null] }), { now: NOW })
    assert.deepEqual([...filtered.enforced], ['vif-1'])
  })

  test("XAPI's lock comes first, and a disabled interface sends nothing", () => {
    const xapiLocked = { ...vdfLocked, lockingMode: 'locked' }
    assert.deepEqual(ipsOf([xapiLocked], undefined), { ips: ['10.0.0.5'], trusted: true })
    assert.deepEqual(ipsOf([{ ...vdfLocked, lockingMode: 'disabled' }], supporting), { ips: [], trusted: false })
  })

  test('a lock to a prefix is untrusted, XAPI or VDF', () => {
    const prefixed = { allowedIpv4Addresses: ['10.0.0.5', '10.0.0.0/8'] }
    assert.deepEqual(ipsOf([{ ...vdfLocked, lockingMode: 'locked', ...prefixed }], undefined), {
      ips: ['10.0.0.5'],
      trusted: false,
    })
    // VDF: its gate can't enforce what XAPI holds, a change pending at best
    assert.equal(ipsOf([{ ...vdfLocked, ...prefixed }], supporting).trusted, false)
    const prefixGate = withLocking({ vdfEnforcedAllowed: { 'vif-1': ['10.0.0.5', '10.0.0.0/8'] } })
    assert.deepEqual(ipsOf([{ ...vdfLocked, ...prefixed }], prefixGate), { ips: ['10.0.0.5'], trusted: false })
    assert.equal(
      ipsOf([{ ...vdfLocked, lockingMode: 'locked', allowedIpv6Addresses: ['fd00::/64'] }], undefined).trusted,
      false
    )
  })

  test("global members' trust follows the host each VM runs on", () => {
    const vms = [
      { ...vm, $container: 'host-ok' },
      { ...vm, id: 'vm-2', $container: 'host-stale' },
    ]
    const statuses = {
      'host-ok': supporting,
      'host-stale': status(LOCKING, { heartbeat: '2026-10-27T11:00:00Z' }),
    }
    const records = runningVmRecords(
      vms,
      () => [vdfLocked],
      undefined,
      ({ $container }) => vdfLockEnforcement(statuses[$container], { now: NOW })
    )
    const members = globalMembers({ global: GLOBAL, records, scope: { all: true } })
    assert.deepEqual(
      members.app.map(member => [member.vm, member.ips, member.trusted]),
      [
        ['vm-1', ['10.0.0.5'], true],
        ['vm-2', ['10.0.0.5', '10.0.0.99'], false],
      ]
    )
  })

  test('host status: read from other_config, fresh within twice its period', () => {
    assert.equal(hostStatus({}), undefined)
    assert.equal(hostStatus({ 'vdf:status': 'not json' }), undefined)
    assert.deepEqual(hostStatus({ 'vdf:status': '{"heartbeat":"x"}' }), { heartbeat: 'x' })
    assert.equal(isFresh({ heartbeat: '2026-10-27T11:50:00Z' }, NOW), true) // 600 s by default
    assert.equal(isFresh({ heartbeat: '2026-10-27T11:30:00Z' }, NOW), false)
    assert.equal(isFresh({ heartbeat: '2026-10-27T11:30:00Z', heartbeatSec: 'x' }, NOW), false)
    assert.equal(isFresh({ heartbeat: '2026-10-27T12:05:00Z' }, NOW), false)
    assert.equal(isFresh({}, NOW), false)
    // a clean stop says so
    assert.equal(isFresh({ heartbeat: '2026-10-27T11:59:50Z', stopping: '2026-10-27T11:59:55Z' }, NOW), false)
  })
})
