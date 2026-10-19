import { ONE_GB } from '@/shared/constants.ts'
import { createV2vDatastore, createV2vInventory, createV2vVmWithDisks } from '@/test/create-v2v-inventory.ts'
import { V2V_VM_POWER_STATE, type XoV2vDatastore, type XoV2vVm } from '@vates/types'

export const V2V_DATASTORE_A = createV2vDatastore({ id: 'datastore-a' as XoV2vDatastore['id'], name: 'ds-a' })

export const V2V_DATASTORE_B = createV2vDatastore({ id: 'datastore-b' as XoV2vDatastore['id'], name: 'ds-b' })

// One VM per case the VMs step tells apart, spread over the two datastores
export const V2V_WEB_VM = createV2vVmWithDisks([{ datastoreId: V2V_DATASTORE_A.id, capacity: 80 * ONE_GB }], {
  id: 'vm-1' as XoV2vVm['id'],
  name: 'web-01',
  datastoreIds: [V2V_DATASTORE_A.id],
})

export const V2V_DB_VM = createV2vVmWithDisks(
  [
    { datastoreId: V2V_DATASTORE_A.id, capacity: 100 * ONE_GB },
    { datastoreId: V2V_DATASTORE_B.id, capacity: 20 * ONE_GB },
  ],
  { id: 'vm-2' as XoV2vVm['id'], name: 'db-01', datastoreIds: [V2V_DATASTORE_A.id, V2V_DATASTORE_B.id] }
)

export const V2V_RDM_VM = createV2vVmWithDisks(
  [{ datastoreId: V2V_DATASTORE_B.id, capacity: 40 * ONE_GB, isRdm: true }],
  {
    id: 'vm-3' as XoV2vVm['id'],
    name: 'legacy-01',
    powerState: V2V_VM_POWER_STATE.POWERED_OFF,
    datastoreIds: [V2V_DATASTORE_B.id],
  }
)

export const V2V_LISTED_VM = createV2vVmWithDisks([{ datastoreId: V2V_DATASTORE_B.id, capacity: 60 * ONE_GB }], {
  id: 'vm-4' as XoV2vVm['id'],
  name: 'listed-01',
  powerState: V2V_VM_POWER_STATE.SUSPENDED,
  datastoreIds: [V2V_DATASTORE_B.id],
})

export const V2V_VMS_INVENTORY = createV2vInventory({
  datastores: [V2V_DATASTORE_A, V2V_DATASTORE_B],
  vms: [V2V_WEB_VM, V2V_DB_VM, V2V_RDM_VM, V2V_LISTED_VM],
})
