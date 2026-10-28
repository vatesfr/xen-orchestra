import { useV2vResumedVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createPool } from '@/test/create-pool.ts'
import { createV2vVm } from '@/test/create-v2v-inventory.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import {
  V2V_ACTIVE_MAPPING_ROWS,
  V2V_DEFAULT_NETWORK,
  V2V_MAPPED_VM,
  V2V_MAPPING_INVENTORY,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_SYNCED_VBD,
  V2V_SYNCED_VDI,
  V2V_SYNCED_VIFS,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'
import { objectIcon } from '@core/icons'
import { V2V_VM_OTHER_CONFIG, type XoV2vVm } from '@vates/types'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
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
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

const POOL = createPool({ id: V2V_RESUMED_IMPORT_VM.$pool })

// The source VM still holds the snapshot its import last synced
const SYNCED_VM = createV2vVm({
  ...V2V_MAPPED_VM,
  currentSnapshotId: V2V_RESUMED_IMPORT_VM.other[V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID],
})

// The pool, the targets and the devices the first sync of the resumed VM left in XO
function seedCollections() {
  destinationCollectionsMock.pools.value = [POOL]
  destinationCollectionsMock.srs.value = [V2V_SSD_SR]
  destinationCollectionsMock.networks.value = [V2V_DEFAULT_NETWORK, V2V_VLAN_NETWORK]
  vmDeviceCollectionsMock.vbds.value = [V2V_SYNCED_VBD]
  vmDeviceCollectionsMock.vdis.value = [V2V_SYNCED_VDI]
  vmDeviceCollectionsMock.vifs.value = V2V_SYNCED_VIFS
}

function mountResumedVm(vm: XoV2vVm = SYNCED_VM, importVm: FrontXoVm = V2V_RESUMED_IMPORT_VM) {
  seedCollections()

  return mountComposableWithI18n(() => {
    connectV2vSource({ inventory: V2V_MAPPING_INVENTORY })

    return useV2vResumedVm(vm, importVm)
  })
}

beforeEach(() => {
  destinationCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
  deleteModalMock.reset()
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
    expect(mountResumedVm().poolName).toBe(POOL.name_label)
  })
})

describe('activeMappingRows', () => {
  it('maps the disks then the NICs of the source VM to the targets of their first sync', () => {
    expect(mountResumedVm().activeMappingRows).toEqual(V2V_ACTIVE_MAPPING_ROWS)
  })

  it('names a target missing from its collection by its id', () => {
    const resumedVm = mountResumedVm()
    destinationCollectionsMock.srs.value = []
    destinationCollectionsMock.networks.value = []

    expect(resumedVm.activeMappingRows.map(row => row.destination)).toEqual([
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
    areSrsReady: destinationCollectionsMock.areSrsReady,
    areNetworksReady: destinationCollectionsMock.areNetworksReady,
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

describe('deleteVm', () => {
  it('asks to confirm the deletion of the import VM, by its name', () => {
    mountResumedVm().deleteVm()

    expect(deleteModalMock.open.mock.lastCall?.[0].props.subject).toBe(V2V_RESUMED_IMPORT_VM.name_label)
  })
})
