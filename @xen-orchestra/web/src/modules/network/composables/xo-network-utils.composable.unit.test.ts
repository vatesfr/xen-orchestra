import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs } = vi.hoisted(() => ({
  pifs: { value: [] as FrontXoPif[] },
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({
    getPifsByNetworkId: (networkId: FrontXoNetwork['id']) => pifs.value.filter(pif => pif.$network === networkId),
  })) as unknown as typeof useXoPifCollection,
}))

beforeEach(() => {
  pifs.value = []
})

function mountNetworkUtils(network: FrontXoNetwork | undefined) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useXoNetworkUtils(network), t }
  }).wrapper.vm
}

describe('networkVlan', () => {
  it('is the vlan of the first pif of the network', () => {
    pifs.value = [createPif({ vlan: 100 }), createPif({ vlan: 200 })]

    expect(mountNetworkUtils(createNetwork()).networkVlan).toBe('100')
  })

  it('is none when the first pif has no vlan', () => {
    pifs.value = [createPif({ vlan: -1 })]

    const { networkVlan, t } = mountNetworkUtils(createNetwork())

    expect(networkVlan).toBe(t('none'))
  })

  it('ignores the pifs of other networks', () => {
    pifs.value = [createPif({ $network: 'network-other' as FrontXoPif['$network'], vlan: 100 })]

    expect(mountNetworkUtils(createNetwork()).networkVlan).toBeUndefined()
  })

  it('is undefined when there is no network', () => {
    pifs.value = [createPif({ vlan: 100 })]

    expect(mountNetworkUtils(undefined).networkVlan).toBeUndefined()
  })
})

describe('networkNbd', () => {
  it('is on when nbd is enabled', () => {
    const { networkNbd, t } = mountNetworkUtils(createNetwork({ nbd: true }))

    expect(networkNbd).toBe(t('on'))
  })

  it('is off when nbd is disabled', () => {
    const { networkNbd, t } = mountNetworkUtils(createNetwork({ nbd: false }))

    expect(networkNbd).toBe(t('off'))
  })
})

describe('networkDefaultLockingMode', () => {
  it('is disabled when the network is locked by default', () => {
    const { networkDefaultLockingMode, t } = mountNetworkUtils(createNetwork({ defaultIsLocked: true }))

    expect(networkDefaultLockingMode).toBe(t('disabled'))
  })

  it('is unlocked when the network is not locked by default', () => {
    const { networkDefaultLockingMode, t } = mountNetworkUtils(createNetwork({ defaultIsLocked: false }))

    expect(networkDefaultLockingMode).toBe(t('unlocked'))
  })
})

describe('networkTypeLabel', () => {
  it('is bonded for a bonded network', () => {
    const { networkTypeLabel, t } = mountNetworkUtils(
      createNetwork({ isBonded: true, PIFs: ['pif-123' as FrontXoPif['id']] })
    )

    expect(networkTypeLabel).toBe(t('bonded-network'))
  })

  it('is internal for a network without pif', () => {
    const { networkTypeLabel, t } = mountNetworkUtils(createNetwork({ PIFs: [] }))

    expect(networkTypeLabel).toBe(t('internal-network'))
  })

  it('is physical for a network with pifs', () => {
    const { networkTypeLabel, t } = mountNetworkUtils(createNetwork({ PIFs: ['pif-123' as FrontXoPif['id']] }))

    expect(networkTypeLabel).toBe(t('physical-network'))
  })
})

describe('isInternalNetwork', () => {
  it('is true for a network without pif', () => {
    expect(mountNetworkUtils(createNetwork({ PIFs: [] })).isInternalNetwork).toBe(true)
  })

  it('is false for a network with pifs', () => {
    expect(mountNetworkUtils(createNetwork({ PIFs: ['pif-123' as FrontXoPif['id']] })).isInternalNetwork).toBe(false)
  })

  it('is false when there is no network', () => {
    expect(mountNetworkUtils(undefined).isInternalNetwork).toBe(false)
  })

  it('follows the network', () => {
    const network = ref(createNetwork({ PIFs: [] }))
    const { wrapper } = mountComposable(() => useXoNetworkUtils(network))

    expect(wrapper.vm.isInternalNetwork).toBe(true)

    network.value = createNetwork({ PIFs: ['pif-123' as FrontXoPif['id']] })

    expect(wrapper.vm.isInternalNetwork).toBe(false)
  })
})
