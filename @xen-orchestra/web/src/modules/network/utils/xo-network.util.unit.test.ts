import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import {
  compareNetworkLockingModes,
  compareNetworkMtus,
  getNetworkVlan,
} from '@/modules/network/utils/xo-network.util.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'

function sortNetworkLabels(
  networks: FrontXoNetwork[],
  compareFn: (network1: FrontXoNetwork, network2: FrontXoNetwork) => number
) {
  return [...networks].sort(compareFn).map(network => network.name_label)
}

describe('compareNetworkMtus', () => {
  it('orders networks by MTU', () => {
    const networks = [
      createNetwork({ name_label: 'Jumbo', MTU: 9000 }),
      createNetwork({ name_label: 'Default', MTU: 1500 }),
    ]

    expect(sortNetworkLabels(networks, compareNetworkMtus)).toEqual(['Default', 'Jumbo'])
  })
})

describe('compareNetworkLockingModes', () => {
  it('orders unlocked networks before locked ones', () => {
    const networks = [
      createNetwork({ name_label: 'Locked', defaultIsLocked: true }),
      createNetwork({ name_label: 'Unlocked', defaultIsLocked: false }),
    ]

    expect(sortNetworkLabels(networks, compareNetworkLockingModes)).toEqual(['Unlocked', 'Locked'])
  })
})

describe('getNetworkVlan', () => {
  it('returns the VLAN of the first PIF', () => {
    expect(getNetworkVlan([createPif({ vlan: 42 })])).toBe(42)
  })

  it('returns -1 when the network has no PIF', () => {
    expect(getNetworkVlan([])).toBe(-1)
  })
})
