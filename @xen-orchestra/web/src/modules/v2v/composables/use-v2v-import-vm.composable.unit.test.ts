import { useV2vImportVm } from '@/modules/v2v/composables/use-v2v-import-vm.composable.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { itIsReadyOnceLoaded } from '@/test/hold-loading.ts'
import { mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { seedV2vResumedVmCollections } from '@/test/seed-v2v-resumed-vm.ts'
import {
  V2V_DATA_DISK,
  V2V_DEFAULT_NETWORK,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'

mockXoVmDeviceCollections('vbd', 'vdi', 'vif')

function mountImportVm() {
  seedV2vResumedVmCollections()

  return mountComposable(() => useV2vImportVm()).wrapper.vm
}

beforeEach(() => {
  resetV2vCollectionMocks()
})

describe('getImportActiveMapping', () => {
  it('pairs the disks and the NICs of the source VM with the devices of its import VM', () => {
    expect(mountImportVm().getImportActiveMapping(V2V_MAPPED_VM, V2V_RESUMED_IMPORT_VM)).toEqual({
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
    const importVmWithoutDevices = createV2vImportVm({ sourceVmId: V2V_MAPPED_VM.id })

    const { disks, nics } = mountImportVm().getImportActiveMapping(V2V_MAPPED_VM, importVmWithoutDevices)

    expect([...disks.map(({ srId }) => srId), ...nics.map(({ networkId }) => networkId)]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})

describe('areImportDevicesReady', () => {
  itIsReadyOnceLoaded(() => {
    const importVm = mountImportVm()

    return () => importVm.areImportDevicesReady
  }, [
    ['the VBDs', 'VBDs'],
    ['the VDIs', 'VDIs'],
    ['the VIFs', 'VIFs'],
  ])
})
