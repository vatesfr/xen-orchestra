import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { recentDrops } from '@/modules/vdf/utils/vdf-recent-drops.util.ts'
import { describe, expect, it } from 'vitest'

const entry = (fields: Partial<VdfRuleLogEntry> = {}): VdfRuleLogEntry => ({
  time: '2026-10-22T10:00:00Z',
  verdict: 'DROP',
  policy: 'app',
  tier: 'application',
  rule: 'default',
  proto: 'tcp',
  src: '192.168.1.46',
  dst: '192.168.1.73',
  dport: '8080',
  vm: 'vdf-app',
  host: 'h1',
  hostName: 'host 1',
  ...fields,
})

const since = Date.parse('2026-10-22T09:50:00Z')

describe('recentDrops', () => {
  it('aggregates dropped flows, suppressed packets included, most frequent first', () => {
    const drops = recentDrops(
      [
        entry(),
        entry({ suppressed: 3 }),
        entry({ dport: '5432' }),
        entry({ verdict: 'ALLOW', dport: '22' }),
        entry({ time: '2026-10-22T09:00:00Z', dport: '9000' }),
        entry({ vm: undefined, dport: '9100' }),
      ],
      { since }
    )

    expect(drops.map(({ port, count }) => ({ port, count }))).toEqual([
      { port: '8080', count: 5 },
      { port: '5432', count: 1 },
    ])
  })

  it('keeps the latest decision and honours the limit', () => {
    const drops = recentDrops(
      [
        entry({ policy: 'web', time: '2026-10-22T10:01:00Z' }),
        entry({ policy: 'app', time: '2026-10-22T09:55:00Z' }),
        entry({ src: '10.0.0.1', proto: 'UDP whatever', dport: '' }),
      ],
      { since, limit: 1 }
    )

    expect(drops).toHaveLength(1)
    expect(drops[0]).toMatchObject({ policy: 'web', count: 2, proto: 'tcp' })
    expect(recentDrops([entry({ proto: 'UDP x', dport: '' })], { since })[0]).toMatchObject({
      proto: 'udp',
      port: undefined,
    })
  })

  it('keys egress drops by source VM and destination (vdf#53)', () => {
    const drops = recentDrops(
      [
        entry({ egress: true, src: '192.168.1.73', dst: '1.1.1.1', dport: '443' }),
        entry({ egress: true, src: '192.168.1.73', dst: '1.1.1.1', dport: '443', suppressed: 1 }),
        entry({ egress: true, src: '192.168.1.73', dst: '8.8.8.8', dport: '443' }),
        // the same addresses inbound: another flow
        entry({ src: '1.1.1.1', dst: '192.168.1.73', dport: '443' }),
      ],
      { since }
    )

    expect(drops.map(({ egress, dst, count }) => ({ egress, dst, count }))).toEqual([
      { egress: true, dst: '1.1.1.1', count: 3 },
      { egress: true, dst: '8.8.8.8', count: 1 },
      { egress: false, dst: '192.168.1.73', count: 1 },
    ])
  })
})
