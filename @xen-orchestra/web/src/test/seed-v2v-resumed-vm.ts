import { createPool } from '@/test/create-pool.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import {
  V2V_DEFAULT_NETWORK,
  V2V_RESUMED_IMPORT_VM,
  V2V_SSD_SR,
  V2V_SYNCED_VBD,
  V2V_SYNCED_VDI,
  V2V_SYNCED_VIFS,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'

export const V2V_RESUMED_VM_POOL = createPool({ id: V2V_RESUMED_IMPORT_VM.$pool })

// The pool, the targets and the devices the first sync of the resumed VM left in XO, read through the mocked
// destination and VM device collections
export function seedV2vResumedVmCollections() {
  destinationCollectionsMock.pools.value = [V2V_RESUMED_VM_POOL]
  destinationCollectionsMock.srs.value = [V2V_SSD_SR]
  destinationCollectionsMock.networks.value = [V2V_DEFAULT_NETWORK, V2V_VLAN_NETWORK]
  vmDeviceCollectionsMock.vbds.value = [V2V_SYNCED_VBD]
  vmDeviceCollectionsMock.vdis.value = [V2V_SYNCED_VDI]
  vmDeviceCollectionsMock.vifs.value = V2V_SYNCED_VIFS
}
