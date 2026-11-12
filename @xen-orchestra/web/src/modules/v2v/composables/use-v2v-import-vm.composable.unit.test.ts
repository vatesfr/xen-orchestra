import { useV2vImportVm } from '@/modules/v2v/composables/use-v2v-import-vm.composable.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { seedV2vResumedVmCollections } from '@/test/seed-v2v-resumed-vm.ts'
import {
  V2V_DATA_DISK,
  V2V_DEFAULT_NETWORK,
  V2V_LAN_NIC,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_SYNCED_VM,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
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

function mountImportVm() {
  seedV2vResumedVmCollections()

  return mountComposable(() => useV2vImportVm()).wrapper.vm
}

beforeEach(() => {
  resetV2vCollectionMocks()
})

describe('getImportPoolName', () => {
  it('names the pool of the import VM', () => {
    expect(mountImportVm().getImportPoolName(V2V_RESUMED_IMPORT_VM)).toBe(V2V_LIST_POOL.name_label)
  })

  it('names the pool by its id while the pools load', () => {
    const importVm = mountImportVm()
    xoCollectionsMock.pools.value = []

    expect(importVm.getImportPoolName(V2V_RESUMED_IMPORT_VM)).toBe(V2V_LIST_POOL.id)
  })
})

describe('getImportActiveMapping', () => {
  it('pairs the disks and the NICs of the source VM with the devices of its import VM', () => {
    expect(mountImportVm().getImportActiveMapping(V2V_SYNCED_VM, V2V_RESUMED_IMPORT_VM)).toEqual({
      disks: [
        { disk: V2V_SYSTEM_DISK, srId: V2V_SSD_SR.id },
        { disk: V2V_DATA_DISK, srId: undefined },
      ],
      nics: [
        { nic: V2V_LAN_NIC, networkId: V2V_DEFAULT_NETWORK.id, isMacKept: true },
        { nic: V2V_VLAN_NIC, networkId: V2V_VLAN_NETWORK.id, isMacKept: false },
      ],
    })
  })

  it('pairs nothing with the devices of another VM', () => {
    const importVmWithoutDevices = createV2vImportVm({ sourceVmId: V2V_SYNCED_VM.id }, { $pool: V2V_LIST_POOL.id })

    const { disks, nics } = mountImportVm().getImportActiveMapping(V2V_SYNCED_VM, importVmWithoutDevices)

    expect([...disks.map(({ srId }) => srId), ...nics.map(({ networkId }) => networkId)]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})

describe('areImportDevicesReady', () => {
  it('is true once the VBDs, the VDIs and the VIFs are loaded', () => {
    expect(mountImportVm().areImportDevicesReady).toBe(true)
  })

  const READY_FLAGS = {
    areVbdsReady: vmDeviceCollectionsMock.areVbdsReady,
    areVdisReady: vmDeviceCollectionsMock.areVdisReady,
    areVifsReady: vmDeviceCollectionsMock.areVifsReady,
  }

  it.each(Object.keys(READY_FLAGS) as (keyof typeof READY_FLAGS)[])('is false while %s is false', readyFlag => {
    const importVm = mountImportVm()
    READY_FLAGS[readyFlag].value = false

    expect(importVm.areImportDevicesReady).toBe(false)
  })
})
