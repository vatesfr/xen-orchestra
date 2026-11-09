import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import {
  V2V_DEFAULT_NETWORK,
  V2V_SSD_SR,
  V2V_SYNCED_VBD,
  V2V_SYNCED_VDI,
  V2V_SYNCED_VIFS,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'

// The pool of the list, the targets and the devices the first sync of the resumed VM left in XO, read through the
// mocked destination and VM device collections
export function seedV2vResumedVmCollections() {
  seedV2vListPool({ srs: [V2V_SSD_SR], networks: [V2V_DEFAULT_NETWORK, V2V_VLAN_NETWORK], templates: [] })
  vmDeviceCollectionsMock.vbds.value = [V2V_SYNCED_VBD]
  vmDeviceCollectionsMock.vdis.value = [V2V_SYNCED_VDI]
  vmDeviceCollectionsMock.vifs.value = V2V_SYNCED_VIFS
}
