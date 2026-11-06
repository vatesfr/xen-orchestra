import { useV2vResumedVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vVm } from '@/test/create-v2v-inventory.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { seedV2vResumedVmCollections, V2V_RESUMED_VM_POOL } from '@/test/seed-v2v-resumed-vm.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import {
  V2V_ACTIVE_DISK_ROWS,
  V2V_ACTIVE_NIC_ROWS,
  V2V_DEFAULT_NETWORK,
  V2V_MAPPED_VM,
  V2V_MAPPING_INVENTORY,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_SYNCED_VM,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'
import { objectIcon } from '@core/icons'
import type { XoV2vVm } from '@vates/types'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

function mountResumedVm(vm: XoV2vVm = V2V_SYNCED_VM, importVm: FrontXoVm = V2V_RESUMED_IMPORT_VM) {
  seedV2vResumedVmCollections()

  return mountComposableWithI18n(() => useV2vResumedVm(vm, importVm), {
    provide: v2vConnectionProvide(createConnectedV2vContext({ inventory: V2V_MAPPING_INVENTORY })),
  })
}

beforeEach(() => {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
})

describe('destinationVm', () => {
  it('names the import VM, with its power state', () => {
    const resumedVm = mountResumedVm()

    expect(resumedVm.destinationVm).toEqual({
      id: V2V_RESUMED_IMPORT_VM.id,
      name: V2V_RESUMED_IMPORT_VM.name_label,
      icon: objectIcon('vm', 'halted'),
      powerLabel: resumedVm.t('vm:status:halted'),
    })
  })
})

describe('poolName', () => {
  it('names the pool of the import VM', () => {
    expect(mountResumedVm().poolName).toBe(V2V_RESUMED_VM_POOL.name_label)
  })
})

describe('activeDiskRows / activeNicRows', () => {
  it('maps the disks and the NICs of the source VM, with their details, to the targets of their first sync', () => {
    const { activeDiskRows, activeNicRows } = mountResumedVm()

    expect([activeDiskRows, activeNicRows]).toEqual([V2V_ACTIVE_DISK_ROWS, V2V_ACTIVE_NIC_ROWS])
  })

  it('names a target missing from its collection by its id', () => {
    const resumedVm = mountResumedVm()
    xoCollectionsMock.srs.value = []
    xoCollectionsMock.networks.value = []

    expect([...resumedVm.activeDiskRows, ...resumedVm.activeNicRows].map(row => row.destination)).toEqual([
      V2V_SSD_SR.id,
      undefined,
      V2V_DEFAULT_NETWORK.id,
      V2V_VLAN_NETWORK.id,
    ])
  })
})

describe('isActiveMappingReady', () => {
  it('is true once the devices of the import VM and their targets are loaded', () => {
    expect(mountResumedVm().isActiveMappingReady).toBe(true)
  })

  const READY_FLAGS = {
    areVbdsReady: vmDeviceCollectionsMock.areVbdsReady,
    areVdisReady: vmDeviceCollectionsMock.areVdisReady,
    areVifsReady: vmDeviceCollectionsMock.areVifsReady,
    areSrsReady: xoCollectionsMock.areSrsReady,
    areNetworksReady: xoCollectionsMock.areNetworksReady,
  }

  it.each(Object.keys(READY_FLAGS) as (keyof typeof READY_FLAGS)[])('is false while %s is false', readyFlag => {
    const resumedVm = mountResumedVm()
    READY_FLAGS[readyFlag].value = false

    expect(resumedVm.isActiveMappingReady).toBe(false)
  })
})

describe('nextTransfer', () => {
  it('sends the delta since the last sync while the source VM holds the synced snapshot', () => {
    expect(mountResumedVm().nextTransfer).toBe('delta')
  })

  it('sends the whole disks again once the source snapshot changed', () => {
    expect(mountResumedVm(createV2vVm({ ...V2V_MAPPED_VM, currentSnapshotId: 'snapshot-2' })).nextTransfer).toBe('full')
  })
})
