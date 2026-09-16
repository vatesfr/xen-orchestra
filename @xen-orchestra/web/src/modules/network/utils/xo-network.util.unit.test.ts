import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

const POOL_ID = 'pool-1' as FrontXoPool['id']
const NETWORK_ID = 'network-1' as FrontXoNetwork['id']

describe('getPoolNetworkRoute', () => {
  it('points at the networks page of the pool, highlighting the given network', () => {
    expect(getPoolNetworkRoute(POOL_ID, NETWORK_ID)).toEqual({
      name: '/pool/[id]/networks',
      params: { id: POOL_ID },
      query: { id: NETWORK_ID },
    })
  })

  it('highlights no network when none is given', () => {
    expect(getPoolNetworkRoute(POOL_ID)).toEqual({
      name: '/pool/[id]/networks',
      params: { id: POOL_ID },
      query: { id: undefined },
    })
  })
})
