import { getNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { createNetwork } from '@/test/create-network.ts'

describe('getNetworkRoute', () => {
  it('is the page of the network', () => {
    expect(getNetworkRoute(createNetwork().id)).toEqual({
      name: '/network/[id]',
      params: { id: 'network-123' },
    })
  })
})
