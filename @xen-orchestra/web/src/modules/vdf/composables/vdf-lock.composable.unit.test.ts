import { sdnControlledVifs, type VdfLockTarget } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { describe, expect, it } from 'vitest'

const target = (vifId: string, fields: Partial<VdfLockTarget> = {}): VdfLockTarget => ({
  vifId,
  device: '0',
  vmName: vifId,
  networkName: undefined,
  addresses: ['10.0.0.5'],
  optional: [],
  lock: 'unlocked',
  poolId: 'pool-a',
  ...fields,
})

describe('sdnControlledVifs (vdf#41)', () => {
  it('the VIFs of a pool with an SDN controller, but a XAPI relock and a VIF of unknown pool', () => {
    expect(
      sdnControlledVifs(
        [
          target('a'),
          target('b', { poolId: 'pool-b' }),
          target('c', { lock: 'xapi' }),
          target('d', { poolId: undefined }),
          target('e', { lock: 'vdf' }),
        ],
        ['pool-a']
      )
    ).toEqual(['a', 'e'])
    expect(sdnControlledVifs([target('a')], [])).toEqual([])
  })
})
