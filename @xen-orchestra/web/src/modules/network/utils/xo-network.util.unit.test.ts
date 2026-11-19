import {
  getNetworkDefaultLockingModeKey,
  getNetworkRoute,
  getNetworkVlan,
} from '@/modules/network/utils/xo-network.util.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'

describe('getNetworkRoute', () => {
  it('is the page of the network', () => {
    expect(getNetworkRoute(createNetwork().id)).toEqual({
      name: '/network/[id]',
      params: { id: 'network-123' },
    })
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
