import {
  getEncryptedEncapsulationsByPool,
  getNetworkDefaultLockingModeKey,
  getNetworkEncapsulation,
  getNetworkRoute,
  getNetworkVlan,
  isEncryptedNetwork,
  isPrivateNetwork,
} from '@/modules/network/utils/xo-network.util.ts'
import {
  createEncryptedNetwork,
  createNetwork,
  createPrivateNetwork,
  NON_PRIVATE_ENCRYPTED_NETWORK,
} from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { OTHER_POOL_ID } from '@/test/create-pool.ts'
import { SDN_CONTROLLER_ENCAPSULATION_KEY, TUNNEL_PROTOCOL } from '@vates/types'

describe('getNetworkRoute', () => {
  it('is the page of the network', () => {
    expect(getNetworkRoute(createNetwork().id)).toEqual({
      name: '/network/[id]',
      params: { id: 'network-123' },
    })
  })
})

it.each([
  {
    name: 'isPrivateNetwork',
    state: 'true for a network of a private network of the SDN controller',
    check: isPrivateNetwork,
    network: createPrivateNetwork(),
    expected: true,
  },
  {
    name: 'isPrivateNetwork',
    state: 'false for a network outside the SDN controller',
    check: isPrivateNetwork,
    network: createNetwork(),
    expected: false,
  },
  {
    name: 'isEncryptedNetwork',
    state: 'true for an encrypted private network',
    check: isEncryptedNetwork,
    network: createEncryptedNetwork(),
    expected: true,
  },
  {
    name: 'isEncryptedNetwork',
    state: 'false for a private network that is not encrypted',
    check: isEncryptedNetwork,
    network: createPrivateNetwork(),
    expected: false,
  },
])('$name is $state', ({ check, network, expected }) => {
  expect(check(network)).toBe(expected)
})

describe('getNetworkEncapsulation', () => {
  it('is the encapsulation of the private network', () => {
    expect(
      getNetworkEncapsulation(
        createPrivateNetwork({ other_config: { [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.VXLAN } })
      )
    ).toBe(TUNNEL_PROTOCOL.VXLAN)
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
    const networks = [
      createPrivateNetwork({ other_config: { [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.GRE } }),
    ]

    expect(getEncryptedEncapsulationsByPool(networks)).toEqual(new Map())
  })

  it('leaves out the networks outside the SDN controller', () => {
    const networks = [NON_PRIVATE_ENCRYPTED_NETWORK]

    expect(getEncryptedEncapsulationsByPool(networks)).toEqual(new Map())
  })
})

describe('getNetworkVlan', () => {
  it('is the VLAN of the first PIF', () => {
    expect(getNetworkVlan([createPif({ vlan: 10 }), createPif({ vlan: 20 })])).toBe(10)
  })

  it('is -1 when the first PIF has no VLAN', () => {
    expect(getNetworkVlan([createPif({ vlan: -1 })])).toBe(-1)
  })

  it('is undefined when the network has no PIF', () => {
    expect(getNetworkVlan([])).toBeUndefined()
  })
})

describe('getNetworkDefaultLockingModeKey', () => {
  it('is "disabled" when the network is locked by default', () => {
    expect(getNetworkDefaultLockingModeKey(createNetwork({ defaultIsLocked: true }))).toBe('disabled')
  })

  it('is "unlocked" when the network is not locked by default', () => {
    expect(getNetworkDefaultLockingModeKey(createNetwork({ defaultIsLocked: false }))).toBe('unlocked')
  })
})
