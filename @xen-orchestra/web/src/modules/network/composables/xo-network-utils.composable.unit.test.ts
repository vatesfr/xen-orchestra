import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { ENCAPSULATION_LABELS } from '@/modules/network/utils/xo-network.util.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createHost } from '@/test/create-host.ts'
import {
  BONDED_NETWORK,
  createEncryptedNetwork,
  createNetwork,
  createPrivateNetwork,
  INTERNAL_NETWORK,
  NON_PRIVATE_ENCRYPTED_NETWORK,
  PHYSICAL_NETWORK,
  PRIVATE_NETWORK,
} from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { SDN_CONTROLLER_ENCAPSULATION_KEY, SDN_CONTROLLER_PREFERRED_CENTER_KEY, TUNNEL_PROTOCOL } from '@vates/types'
import { ref } from 'vue'

const { pifs, hosts } = xoCollectionsMock

mockXoCollections('host', 'pif')

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountNetworkUtils(network: FrontXoNetwork | undefined) {
  return mountComposable(() => useXoNetworkUtils(network)).wrapper.vm
}

describe('networkVlan', () => {
  it('is the vlan of the first pif of the network', () => {
    pifs.value = [createPif({ vlan: 100 }), createPif({ vlan: 200 })]

    expect(mountNetworkUtils(createNetwork()).networkVlan).toBe('100')
  })

  it('is none when the first pif has no vlan', () => {
    pifs.value = [createPif({ vlan: -1 })]

    expect(mountNetworkUtils(createNetwork()).networkVlan).toBe(t('none'))
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

it.each([
  { property: 'networkNbd', state: 'on when nbd is enabled', overrides: { nbd: true }, label: t('on') },
  { property: 'networkNbd', state: 'off when nbd is disabled', overrides: { nbd: false }, label: t('off') },
  {
    property: 'networkDefaultLockingMode',
    state: 'disabled when the network is locked by default',
    overrides: { defaultIsLocked: true },
    label: t('disabled'),
  },
  {
    property: 'networkDefaultLockingMode',
    state: 'unlocked when the network is not locked by default',
    overrides: { defaultIsLocked: false },
    label: t('unlocked'),
  },
] as const)('$property is $state', ({ property, overrides, label }) => {
  expect(mountNetworkUtils(createNetwork(overrides))[property]).toBe(label)
})

describe('networkTypeLabel', () => {
  it.each([
    {
      kind: 'bonded for a bonded network',
      network: BONDED_NETWORK,
      label: t('bonded-network'),
    },
    { kind: 'internal for a network without pif', network: INTERNAL_NETWORK, label: t('internal-network') },
    {
      kind: 'physical for a network with pifs',
      network: PHYSICAL_NETWORK,
      label: t('physical-network'),
    },
    { kind: 'private for a private network', network: PRIVATE_NETWORK, label: t('private-network') },
  ])('is $kind', ({ network, label }) => {
    expect(mountNetworkUtils(network).networkTypeLabel).toBe(label)
  })
})

it.each([
  { property: 'isInternalNetwork', state: 'true for a network without pif', network: INTERNAL_NETWORK, expected: true },
  { property: 'isInternalNetwork', state: 'false for a network with pifs', network: PHYSICAL_NETWORK, expected: false },
  { property: 'isInternalNetwork', state: 'false when there is no network', network: undefined, expected: false },
  { property: 'isPrivateNetwork', state: 'true for a private network', network: PRIVATE_NETWORK, expected: true },
  {
    property: 'isPrivateNetwork',
    state: 'false for a network outside the SDN controller',
    network: PHYSICAL_NETWORK,
    expected: false,
  },
  {
    property: 'isNetworkEncrypted',
    state: 'true for an encrypted private network',
    network: createEncryptedNetwork(),
    expected: true,
  },
  {
    property: 'isNetworkEncrypted',
    state: 'false for a private network that is not encrypted',
    network: PRIVATE_NETWORK,
    expected: false,
  },
  {
    property: 'isNetworkEncrypted',
    state: 'false for a network that is not private',
    network: NON_PRIVATE_ENCRYPTED_NETWORK,
    expected: false,
  },
] as const)('$property is $state', ({ property, network, expected }) => {
  expect(mountNetworkUtils(network)[property]).toBe(expected)
})

describe('isInternalNetwork', () => {
  it('follows the network', () => {
    const network = ref(INTERNAL_NETWORK)
    const { wrapper } = mountComposable(() => useXoNetworkUtils(network))

    expect(wrapper.vm.isInternalNetwork).toBe(true)

    network.value = PHYSICAL_NETWORK

    expect(wrapper.vm.isInternalNetwork).toBe(false)
  })
})

describe('networkPreferredCenter', () => {
  it('is the host set as preferred center of the private network', () => {
    const host = createHost()

    hosts.value = [host]

    const result = mountNetworkUtils(
      createPrivateNetwork({ other_config: { [SDN_CONTROLLER_PREFERRED_CENTER_KEY]: host.id } })
    )

    expect(result.networkPreferredCenter).toEqual(host)
  })

  it('is undefined when the private network has no preferred center', () => {
    hosts.value = [createHost()]

    expect(mountNetworkUtils(PRIVATE_NETWORK).networkPreferredCenter).toBeUndefined()
  })

  it('is undefined when the preferred center is not found', () => {
    const result = mountNetworkUtils(
      createPrivateNetwork({ other_config: { [SDN_CONTROLLER_PREFERRED_CENTER_KEY]: 'host-gone' } })
    )

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
      createPrivateNetwork({ other_config: { [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.VXLAN } })
    )

    expect(result.networkEncapsulationLabel).toBe(ENCAPSULATION_LABELS[TUNNEL_PROTOCOL.VXLAN])
  })

  it('is GRE for a private network using GRE', () => {
    const result = mountNetworkUtils(
      createPrivateNetwork({ other_config: { [SDN_CONTROLLER_ENCAPSULATION_KEY]: TUNNEL_PROTOCOL.GRE } })
    )

    expect(result.networkEncapsulationLabel).toBe(ENCAPSULATION_LABELS[TUNNEL_PROTOCOL.GRE])
  })

  it('is undefined for a network that is not private', () => {
    expect(mountNetworkUtils(createNetwork()).networkEncapsulationLabel).toBeUndefined()
  })
})
