import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { ENCAPSULATION_LABELS } from '@/modules/network/utils/xo-network.util.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import {
  SDN_CONTROLLER_ENCAPSULATION_KEY,
  SDN_CONTROLLER_ENCRYPTED_KEY,
  SDN_CONTROLLER_PREFERRED_CENTER_KEY,
  SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY,
  TUNNEL_PROTOCOL,
} from '@vates/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs, hosts } = vi.hoisted(() => ({
  pifs: { value: [] as FrontXoPif[] },
  hosts: { value: [] as FrontXoHost[] },
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    getHostById: (id: FrontXoHost['id']) => hosts.value.find(host => host.id === id),
  })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({
    getPifsByNetworkId: (networkId: FrontXoNetwork['id']) => pifs.value.filter(pif => pif.$network === networkId),
  })) as unknown as typeof useXoPifCollection,
}))

beforeEach(() => {
  pifs.value = []
  hosts.value = []
})

function createPrivateNetwork(otherConfig: Record<string, string> = {}) {
  return createNetwork({
    PIFs: ['pif-123' as FrontXoPif['id']],
    other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: 'private-network-1', ...otherConfig },
  })
}

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

  it('is private for a private network', () => {
    const { networkTypeLabel, t } = mountNetworkUtils(
      createNetwork({
        PIFs: ['pif-123' as FrontXoPif['id']],
        other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: 'private-network-1' },
      })
    )

    expect(networkTypeLabel).toBe(t('private-network'))
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

describe('isPrivateNetwork', () => {
  it('is true for a private network', () => {
    expect(mountNetworkUtils(createPrivateNetwork()).isPrivateNetwork).toBe(true)
  })

  it('is false for a network outside the SDN controller', () => {
    expect(mountNetworkUtils(createNetwork({ PIFs: ['pif-123' as FrontXoPif['id']] })).isPrivateNetwork).toBe(false)
  })
})

describe('networkPreferredCenter', () => {
  it('is the host set as preferred center of the private network', () => {
    const host = createHost()

    hosts.value = [host]

    const result = mountNetworkUtils(createPrivateNetwork({ [SDN_CONTROLLER_PREFERRED_CENTER_KEY]: host.id }))

    expect(result.networkPreferredCenter).toEqual(host)
  })

  it('is undefined when the private network has no preferred center', () => {
    hosts.value = [createHost()]

    expect(mountNetworkUtils(createPrivateNetwork()).networkPreferredCenter).toBeUndefined()
  })

  it('is undefined when the preferred center is not found', () => {
    const result = mountNetworkUtils(createPrivateNetwork({ [SDN_CONTROLLER_PREFERRED_CENTER_KEY]: 'host-gone' }))

    expect(result.networkPreferredCenter).toBeUndefined()
  })

  it('is undefined for a network that is not private', () => {
    const host = createHost()

    hosts.value = [host]

    const network = createNetwork({ other_config: { [SDN_CONTROLLER_PREFERRED_CENTER_KEY]: host.id } })

    expect(mountNetworkUtils(network).networkPreferredCenter).toBeUndefined()
  })
})

describe('networkEncapsulationLabel', () => {
  it('is VxLAN for a private network using VxLAN', () => {
    const result = mountNetworkUtils(
      createPrivateNetwork({ [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.VXLAN })
    )

    expect(result.networkEncapsulationLabel).toBe(ENCAPSULATION_LABELS[TUNNEL_PROTOCOL.VXLAN])
  })

  it('is GRE for a private network using GRE', () => {
    const result = mountNetworkUtils(createPrivateNetwork({ [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.GRE }))

    expect(result.networkEncapsulationLabel).toBe(ENCAPSULATION_LABELS[TUNNEL_PROTOCOL.GRE])
  })

  it('is undefined for a network that is not private', () => {
    expect(mountNetworkUtils(createNetwork()).networkEncapsulationLabel).toBeUndefined()
  })
})

describe('isNetworkEncrypted', () => {
  it('is true for an encrypted private network', () => {
    expect(mountNetworkUtils(createPrivateNetwork({ [SDN_CONTROLLER_ENCRYPTED_KEY]: 'true' })).isNetworkEncrypted).toBe(
      true
    )
  })

  it('is false for a private network that is not encrypted', () => {
    expect(mountNetworkUtils(createPrivateNetwork()).isNetworkEncrypted).toBe(false)
  })

  it('is false for a network that is not private', () => {
    expect(
      mountNetworkUtils(createNetwork({ other_config: { [SDN_CONTROLLER_ENCRYPTED_KEY]: 'true' } })).isNetworkEncrypted
    ).toBe(false)
  })
})
