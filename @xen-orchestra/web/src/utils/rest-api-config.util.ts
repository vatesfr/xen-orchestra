import type { XoObjectType } from '@/types/xo-object.type'

export const restApiConfig: Record<XoObjectType, { path: string; fields: string }> = {
  VM: {
    path: 'vms',
    fields: 'id,name_label,name_description,power_state,$container,$pool,other',
  },
  host: {
    path: 'hosts',
    fields: 'id,name_label,name_description,power_state,residentVms,$pool',
  },
  pool: {
    path: 'pools',
    fields: 'id,name_label,master',
  },
  task: {
    path: 'tasks',
    fields: 'id,start,end,properties,status,progress,tasks',
  },
  alarm: {
    path: 'alarms',
    fields: 'id,level,triggerLevel,type',
  },
}
