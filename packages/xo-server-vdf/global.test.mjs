import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  checkGlobalDocument,
  checkLocalDocument,
  compose,
  GLOBAL_RULE_BASE,
  globalMembers,
  localPart,
  poolSyncState,
  remoteIpsFor,
  vmIps,
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
    b3: [{ lockingMode: 'locked', allowedIpv4Addresses: ['10.1.0.20'], allowedIpv6Addresses: ['fd00::20', 'fe80::1'] }],
  }
  const vifsOf = vm => vifs[vm.id] ?? []
  const scope = { pools: ['A', 'B'] }

  test('running members of the pools in scope, locked IPs authoritative', () => {
    const members = globalMembers({ global: GLOBAL, vms, vifsOf, scope })

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
    const members = globalMembers({ global: GLOBAL, vms, vifsOf, scope })

    assert.deepEqual(remoteIpsFor('A', members), { admins: [], app: ['10.1.0.9'], db: ['10.1.0.20', 'fd00::20'] })
    assert.deepEqual(remoteIpsFor('B', members).app, ['10.0.0.5'])
  })

  test('guest IPs when no VIF is locked', () => {
    assert.deepEqual(
      vmIps({ addresses: { '0/ipv4/0': '10.0.0.1', '0/ipv6/0': 'fe80::2', '0/ipv6/1': 'fd00::2' } }, []),
      {
        ips: ['10.0.0.1', 'fd00::2'],
        trusted: false,
      }
    )
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
