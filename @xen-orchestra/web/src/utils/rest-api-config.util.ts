import type { XoObjectType } from '@/types/xo-object.type'

export const restApiConfig: Record<XoObjectType, { path: string; fields: string }> = {
  VM: {
    path: 'vms',
    fields: 'id,name_label,power_state,$container,other',
  },
  host: {
    path: 'hosts',
    fields: 'id,name_label,power_state,residentVms,$pool',
  },
  pool: {
    path: 'pools',
    fields: 'id,name_label,master',
  },
}
