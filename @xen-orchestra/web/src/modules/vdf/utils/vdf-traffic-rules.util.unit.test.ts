import type { VdfShadowedVif } from '@/modules/vdf/types.ts'
import { mostSevere, shadowedVifs, trafficRuleStatus } from '@/modules/vdf/utils/vdf-traffic-rules.util.ts'
import { describe, expect, it } from 'vitest'

const shadow = (fields: Partial<VdfShadowedVif> = {}): VdfShadowedVif => ({
  vm: 'vm-1',
  vmName: 'web-1',
  vif: 'vif-1',
  allows: 0,
  drops: 0,
  sample: 'cookie=0x0, priority=32768,tcp,dl_dst=aa:bb:cc:dd:ee:ff,tp_dst=22 actions=NORMAL',
  ...fields,
})

describe('trafficRuleStatus', () => {
  it('bypasses VDF for an allow, decides first for a drop, as the agent found them', () => {
    expect(trafficRuleStatus({ allow: true }, shadow({ allows: 2 }))).toBe('bypasses')
    expect(trafficRuleStatus({ allow: false }, shadow({ drops: 1 }))).toBe('decides-first')
    expect(trafficRuleStatus({ allow: false }, shadow({ allows: 2 }))).toBe('not-applied')
    expect(trafficRuleStatus({ allow: true }, undefined)).toBe('not-applied')
  })

  it('agents putting VDF first (vdf#40, vdf#102): an allow lets nothing past VDF, a drop applies after it', () => {
    expect(trafficRuleStatus({ allow: true }, undefined, true)).toBe('vdf-first')
    expect(trafficRuleStatus({ allow: false }, undefined, true)).toBe('applies-after')
    // flows still found deciding first (another controller's) say so
    expect(trafficRuleStatus({ allow: true }, shadow({ allows: 1 }), true)).toBe('bypasses')
  })
})

describe('mostSevere', () => {
  it("a network's rule takes the most telling status of its guarded VMs", () => {
    expect(mostSevere(['vdf-first', 'not-applied', 'applies-after'])).toBe('not-applied')
    expect(mostSevere(['vdf-first', 'bypasses'])).toBe('bypasses')
    expect(mostSevere([])).toBeUndefined()
  })
})

describe('shadowedVifs', () => {
  it('indexes the reports of every host by VIF, without stale agents', () => {
    const byVif = shadowedVifs([
      { status: { shadowed: [shadow({ allows: 1 })] }, state: 'up-to-date' },
      { status: undefined, state: 'unknown' },
      { status: { shadowed: [shadow({ vif: 'vif-2', drops: 1 })] }, state: 'stale' },
      { status: {}, state: 'behind' },
    ])

    expect([...byVif.keys()]).toEqual(['vif-1'])
    expect(byVif.get('vif-1')?.allows).toBe(1)
  })
})
