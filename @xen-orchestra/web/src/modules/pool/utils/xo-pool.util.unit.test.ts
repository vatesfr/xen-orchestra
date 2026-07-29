import { getPoolInfo } from '@/modules/pool/utils/xo-pool.util.ts'
import { createServer } from '@/test/create-server.ts'

describe('getPoolInfo', () => {
  test('returns the pool name label, dashboard link and pool icon when a name label is set', () => {
    const server = createServer({ poolNameLabel: 'Production Pool' })

    expect(getPoolInfo(server)).toEqual({
      label: 'Production Pool',
      to: '/pool/pool-789/dashboard',
      icon: 'object:pool',
    })
  })

  test('omits the link when a name label is set but no pool id is available', () => {
    const server = createServer({ poolNameLabel: 'Production Pool', poolId: undefined })

    expect(getPoolInfo(server)).toEqual({
      label: 'Production Pool',
      to: undefined,
      icon: 'object:pool',
    })
  })

  test('falls back to the pool id as label when there is no name label', () => {
    const server = createServer({ poolNameLabel: undefined })

    expect(getPoolInfo(server)).toEqual({
      label: 'pool-789',
      to: '/pool/pool-789/dashboard',
      icon: 'object:pool',
    })
  })

  test('returns an empty label with no link nor icon when neither name label nor pool id are set', () => {
    const server = createServer({ poolNameLabel: undefined, poolId: undefined })

    expect(getPoolInfo(server)).toEqual({
      label: '',
      to: undefined,
      icon: undefined,
    })
  })
})
