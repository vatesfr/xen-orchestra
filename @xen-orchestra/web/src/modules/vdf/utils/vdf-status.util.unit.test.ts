import type { VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import { hostState, policyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
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

describe('hostState', () => {
  it('reads an agent enforcing the published document as up to date', () => {
    expect(hostState(status(), 'abc', { now })).toBe('up-to-date')
  })

  it('tells behind, rejected, stale, unknown and halted hosts apart', () => {
    expect(hostState(status({ doc: 'old' }), 'abc', { now })).toBe('behind')
    expect(hostState(status({ rejected: 'unknown field' }), 'abc', { now })).toBe('rejected')
    expect(hostState(status({ heartbeat: '2026-10-22T09:30:00Z' }), 'abc', { now })).toBe('stale')
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
