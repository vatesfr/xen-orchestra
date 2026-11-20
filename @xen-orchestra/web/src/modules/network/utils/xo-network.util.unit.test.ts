import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import {
  getEncryptedEncapsulationsByPool,
  getNetworkEncapsulation,
  getNetworkRoute,
  isEncryptedNetwork,
  isPrivateNetwork,
} from '@/modules/network/utils/xo-network.util.ts'
import { createNetwork } from '@/test/create-network.ts'
import { OTHER_POOL_ID } from '@/test/create-pool.ts'
import { TUNNEL_PROTOCOL } from '@vates/types'

function createPrivateNetwork(otherConfig: Record<string, string> = {}, overrides: Partial<FrontXoNetwork> = {}) {
  return createNetwork({
    other_config: { 'xo:sdn-controller:private-network-uuid': 'private-network-1', ...otherConfig },
    ...overrides,
  })
}

function createEncryptedNetwork(encapsulation?: TUNNEL_PROTOCOL, overrides: Partial<FrontXoNetwork> = {}) {
  const otherConfig: Record<string, string> = { 'xo:sdn-controller:encrypted': 'true' }

  if (encapsulation !== undefined) {
    otherConfig['xo:sdn-controller:encapsulation'] = encapsulation
  }

  return createPrivateNetwork(otherConfig, overrides)
}

describe('getNetworkRoute', () => {
  it('is the page of the network', () => {
    expect(getNetworkRoute(createNetwork().id)).toEqual({
      name: '/network/[id]',
      params: { id: 'network-123' },
    })
  })
})

describe('isPrivateNetwork', () => {
  it('is true for a network of a private network of the SDN controller', () => {
    expect(isPrivateNetwork(createPrivateNetwork())).toBe(true)
  })

  it('is false for a network outside the SDN controller', () => {
    expect(isPrivateNetwork(createNetwork())).toBe(false)
  })
})

describe('isEncryptedNetwork', () => {
  it('is true for an encrypted private network', () => {
    expect(isEncryptedNetwork(createEncryptedNetwork())).toBe(true)
  })

  it('is false for a private network that is not encrypted', () => {
    expect(isEncryptedNetwork(createPrivateNetwork())).toBe(false)
  })
})

describe('getNetworkEncapsulation', () => {
  it('is the encapsulation of the private network', () => {
    expect(getNetworkEncapsulation(createPrivateNetwork({ 'xo:sdn-controller:encapsulation': 'vxlan' }))).toBe(
      TUNNEL_PROTOCOL.VXLAN
    )
  })

  it('is GRE when the private network does not set its encapsulation', () => {
    expect(getNetworkEncapsulation(createPrivateNetwork())).toBe(TUNNEL_PROTOCOL.GRE)
  })
})

describe('getEncryptedEncapsulationsByPool', () => {
  it('groups the encapsulations of the encrypted private networks by pool', () => {
    const networks = [
      createEncryptedNetwork(TUNNEL_PROTOCOL.GRE),
      createEncryptedNetwork(TUNNEL_PROTOCOL.VXLAN),
      createEncryptedNetwork(TUNNEL_PROTOCOL.VXLAN, { $pool: OTHER_POOL_ID }),
    ]

    expect(getEncryptedEncapsulationsByPool(networks)).toEqual(
      new Map([
        [createNetwork().$pool, new Set([TUNNEL_PROTOCOL.GRE, TUNNEL_PROTOCOL.VXLAN])],
        [OTHER_POOL_ID, new Set([TUNNEL_PROTOCOL.VXLAN])],
      ])
    )
  })

  it('reads an encrypted private network without encapsulation as GRE, the SDN controller default', () => {
    expect(getEncryptedEncapsulationsByPool([createEncryptedNetwork()])).toEqual(
      new Map([[createNetwork().$pool, new Set([TUNNEL_PROTOCOL.GRE])]])
    )
  })

  it('leaves out the private networks that are not encrypted', () => {
    const networks = [createPrivateNetwork({ 'xo:sdn-controller:encapsulation': TUNNEL_PROTOCOL.GRE })]

    expect(getEncryptedEncapsulationsByPool(networks)).toEqual(new Map())
  })

  it('leaves out the networks outside the SDN controller', () => {
    const networks = [createNetwork({ other_config: { 'xo:sdn-controller:encrypted': 'true' } })]

    expect(getEncryptedEncapsulationsByPool(networks)).toEqual(new Map())
  })
})
