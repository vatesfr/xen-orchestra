import { useV2vResumedVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { seedV2vResumedVmCollections } from '@/test/seed-v2v-resumed-vm.ts'
import { v2vMappingConnectionProvide } from '@/test/v2v-connection-provide.ts'
import {
  V2V_ACTIVE_DISK_ROWS,
  V2V_ACTIVE_NIC_ROWS,
  V2V_DEFAULT_NETWORK,
  V2V_MAPPED_VM,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import { objectIcon } from '@core/icons'
import type { XoV2vVm } from '@vates/types'

mockXoCollections('network', 'pool', 'sr')
mockXoVmDeviceCollections('vbd', 'vdi', 'vif')

function mountResumedVm(vm: XoV2vVm = V2V_MAPPED_VM, importVm: FrontXoVm = V2V_RESUMED_IMPORT_VM) {
  seedV2vResumedVmCollections()

  return mountComposableWithI18n(() => useV2vResumedVm(vm, importVm), {
    provide: v2vMappingConnectionProvide(),
  })
}

beforeEach(() => {
  resetV2vCollectionMocks()
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
    expect(mountResumedVm().poolName).toBe(V2V_LIST_POOL.name_label)
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

  // Which device flag `areImportDevicesReady` reads is covered by the `useV2vImportVm` tests
  const READY_FLAGS = {
    'the devices of the import VM': vmDeviceCollectionsMock.areVbdsReady,
    'the SRs': xoCollectionsMock.areSrsReady,
    'the networks': xoCollectionsMock.areNetworksReady,
  }

  it.each(Object.keys(READY_FLAGS) as (keyof typeof READY_FLAGS)[])('is false while %s load', readyFlag => {
    const resumedVm = mountResumedVm()
    READY_FLAGS[readyFlag].value = false

    expect(resumedVm.isActiveMappingReady).toBe(false)
  })
})
