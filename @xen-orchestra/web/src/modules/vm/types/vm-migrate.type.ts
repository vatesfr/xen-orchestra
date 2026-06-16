import type { XoHost, XoNetwork, XoPool, XoSr, XoVdi, XoVif, XoVm } from '@vates/types'
import type { InjectionKey } from 'vue'

export type VmMigratePayload = {
  hostId: XoHost['id']
  migrationNetworkId?: XoNetwork['id']
  srId?: XoSr['id']
  srIdByVdiId?: Record<XoVdi['id'], XoSr['id']>
  networkIdByVifId?: Record<XoVif['id'], XoNetwork['id']>
}

export type VmMigratePayloadByVmId = Record<XoVm['id'], VmMigratePayload>

export type VmMigrateFormState = {
  poolId: XoPool['id'] | undefined
  hostId: XoHost['id'] | undefined
  migrationNetworkId: XoNetwork['id'] | undefined
  srIdByVdiId: Record<XoVdi['id'], XoSr['id'] | undefined>
  networkIdByVifId: Record<XoVif['id'], XoNetwork['id'] | undefined>
  vdiStrategy: 'minimum' | 'force'
  selectedSrId: XoSr['id'] | undefined
}

export const IK_VM_MIGRATE_FORM = Symbol('IK_VM_MIGRATE_FORM') as InjectionKey<VmMigrateFormState>
