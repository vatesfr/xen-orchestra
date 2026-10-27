import type { VdfDocument, VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import {
  agentGaps,
  effectiveLockingMode,
  enforcedVersion,
  hostState,
  ignoresEgress,
  policyRealization,
  vmProtection,
} from '@/modules/vdf/utils/vdf-status.util.ts'
import { describe, expect, it } from 'vitest'

const now = Date.parse('2026-10-22T10:00:00Z')

const status = (fields: Partial<VdfHostStatusDocument> = {}): VdfHostStatusDocument => ({
  heartbeat: '2026-10-22T09:55:00Z',
  heartbeatSec: 600,
  doc: 'abc',
  published: 'abc',
  policies: [{ name: 'app', tier: 'application', vifs: 1, realized: true }],
  ...fields,
})

describe('ignoresEgress', () => {
  const document = (egress: boolean): VdfDocument => ({
    groups: {},
    policies: [
      {
        name: 'app',
        appliedTo: 'app',
        tier: 'application',
        default: 'drop',
        ingress: [],
        ...(egress ? { egress: [{ id: 2, to: 'any', proto: 'tcp', ports: [443] }] } : {}),
      },
    ],
  })

  it('reads the format from the key the agent enforces', () => {
    expect(enforcedVersion(status({ source: 'vdf:policy.v6' }))).toBe(6)
    expect(enforcedVersion(status({ source: 'vdf:policy' }))).toBe(1)
    expect(enforcedVersion(status({ source: 'last valid policy' }))).toBeUndefined()
    expect(enforcedVersion(undefined)).toBeUndefined()
  })

  it('flags an agent older than egress only when the document has egress', () => {
    expect(ignoresEgress(status({ source: 'vdf:policy.v5' }), document(true))).toBe(true)
    expect(ignoresEgress(status({ source: 'vdf:policy.v6' }), document(true))).toBe(false)
    expect(ignoresEgress(status({ source: 'vdf:policy.v5' }), document(false))).toBe(false)
  })
})

describe('hostState', () => {
  it('reads an agent enforcing the published document as up to date', () => {
    expect(hostState(status(), 'abc', { now })).toBe('up-to-date')
  })

  it('tells behind, rejected, stale, unknown and halted hosts apart', () => {
    expect(hostState(status({ doc: 'old' }), 'abc', { now })).toBe('behind')
    expect(hostState(status({ rejected: 'unknown field' }), 'abc', { now })).toBe('rejected')
    expect(hostState(status({ heartbeat: '2026-10-22T09:30:00Z' }), 'abc', { now })).toBe('stale')
    // a heartbeat from the future says nothing about now (a minute of skew passes)
    expect(hostState(status({ heartbeat: '2026-10-22T10:30:00Z' }), 'abc', { now })).toBe('stale')
    expect(hostState(status({ heartbeat: new Date(now + 30e3).toISOString() }), 'abc', { now })).toBe('up-to-date')
    expect(hostState(undefined, 'abc', { now })).toBe('unknown')
    expect(hostState(status(), 'abc', { now, live: false })).toBe('disabled')
  })
})

describe('policyRealization', () => {
  it('counts hosts the policy concerns, hosts without a reliable status apart', () => {
    expect(
      policyRealization('app', [
        { status: status(), state: 'up-to-date' },
        {
          status: status({
            policies: [{ name: 'app', tier: 'application', vifs: 1, realized: false, reason: 'apply failed' }],
          }),
          state: 'up-to-date',
        },
        { status: status({ policies: [] }), state: 'up-to-date' },
        { status: undefined, state: 'unknown' },
      ])
    ).toEqual({ realized: 1, total: 2, unknown: 1, reasons: ['apply failed'] })
  })
})

describe('vmProtection', () => {
  const vm = (fields: Partial<Parameters<typeof vmProtection>[0]> = {}) =>
    vmProtection({ quarantined: false, running: true, policyCount: 2, hostState: 'up-to-date', ...fields })

  it('only calls a running VM protected', () => {
    expect(vm()).toBe('protected')
    expect(vm({ running: false })).toBe('protected-when-running')
    expect(vm({ policyCount: 0 })).toBe('unprotected')
    expect(vm({ quarantined: true, running: false, policyCount: 0 })).toBe('quarantined')
  })

  // #37: enforcement happens only on the host the VM runs on
  it('is exposed on a host whose agent is missing, stopped or stuck', () => {
    expect(vm({ hostState: 'unknown' })).toBe('exposed')
    expect(vm({ hostState: 'stale' })).toBe('exposed')
    expect(vm({ hostState: 'disabled' })).toBe('exposed')
  })

  it('is outdated on a host that enforces the previous document', () => {
    expect(vm({ hostState: 'behind' })).toBe('outdated')
    expect(vm({ hostState: 'rejected' })).toBe('outdated')
  })

  it("doesn't call a quarantine enforced on a host without a working agent", () => {
    expect(vm({ quarantined: true, hostState: 'unknown' })).toBe('quarantine-not-enforced')
    expect(vm({ quarantined: true, hostState: 'stale' })).toBe('quarantine-not-enforced')
    expect(vm({ quarantined: true, hostState: 'rejected' })).toBe('quarantined')
  })

  // vdf#13: a policy in monitor mode records what it would drop, protects nothing
  it('is monitored, not protected, with only policies in monitor mode', () => {
    expect(vm({ policyCount: 0, monitoredCount: 2 })).toBe('monitored')
    expect(vm({ policyCount: 1, monitoredCount: 2 })).toBe('protected')
    expect(vm({ policyCount: 0, monitoredCount: 0 })).toBe('unprotected')
  })

  it("doesn't depend on the host for a halted VM", () => {
    expect(vm({ running: false, hostState: 'unknown' })).toBe('protected-when-running')
    expect(vm({ running: false, quarantined: true, hostState: 'unknown' })).toBe('quarantined')
  })
})

describe('effectiveLockingMode', () => {
  it('resolves the network default', () => {
    expect(effectiveLockingMode('locked', true)).toBe('locked')
    expect(effectiveLockingMode('network_default', false)).toBe('unlocked')
    expect(effectiveLockingMode('network_default', undefined)).toBe('unlocked')
    expect(effectiveLockingMode('network_default', true)).toBe('disabled')
  })
})

describe('agentGaps', () => {
  it('names the running hosts with no agent or a stopped one, apart', () => {
    expect(
      agentGaps(
        [
          { name: 'xcp2', status: undefined, running: true },
          { name: 'xcp1', status: status(), running: true },
          { name: 'xcp4', status: status({ heartbeat: '2026-10-22T09:00:00Z' }), running: true },
          { name: 'xcp3', status: undefined, running: true },
          { name: 'xcp5', status: status({ heartbeat: 'garbage' }), running: true },
        ],
        now
      )
    ).toEqual({ missing: ['xcp2', 'xcp3'], stale: ['xcp4', 'xcp5'] })
  })

  it("doesn't count an agent behind or rejecting as missing, nor a halted host", () => {
    expect(
      agentGaps(
        [
          { name: 'behind', status: status({ doc: 'old' }), running: true },
          { name: 'rejected', status: status({ rejected: 'bad' }), running: true },
          { name: 'halted', status: undefined, running: false },
        ],
        now
      )
    ).toEqual({ missing: [], stale: [] })
  })
})
