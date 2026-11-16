import { useV2vTargetNameGetters } from '@/modules/v2v/composables/use-v2v-target-name-getters.composable.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { V2V_SSD_SR, V2V_VLAN_NETWORK } from '@/test/v2v-mapping-fixtures.ts'

vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

function mountNameGetters() {
  return mountComposable(() => useV2vTargetNameGetters()).wrapper.vm
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

it('names an SR and a network after their collection', () => {
  xoCollectionsMock.srs.value = [V2V_SSD_SR]
  xoCollectionsMock.networks.value = [V2V_VLAN_NETWORK]

  const { getSrName, getNetworkName } = mountNameGetters()

  expect(getSrName(V2V_SSD_SR.id)).toBe(V2V_SSD_SR.name_label)
  expect(getNetworkName(V2V_VLAN_NETWORK.id)).toBe(V2V_VLAN_NETWORK.name_label)
})

it('names no target missing from its collection', () => {
  const { getSrName, getNetworkName } = mountNameGetters()

  expect(getSrName(V2V_SSD_SR.id)).toBeUndefined()
  expect(getNetworkName(V2V_VLAN_NETWORK.id)).toBeUndefined()
})
