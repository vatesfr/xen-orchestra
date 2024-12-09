import type { ApiDefinition } from '@/types/xo'
import type { XoDashboard } from '@/types/xo/dashboard.type'
import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoServer } from '@/types/xo/server.type'
import type { XoTask } from '@/types/xo/task.type'
import type { XoVm } from '@/types/xo/vm.type'

export const xoApiDefinition = {
  pool: {
    type: 'collection',
    path: 'pools',
    fields: 'id,name_label,master',
    handler: (record: XoPool) => record,
  },
  host: {
    type: 'collection',
    path: 'hosts',
    fields: 'id,name_label,name_description,power_state,controlDomain,residentVms,$pool',
    handler: (record: XoHost) => record,
  },
  vm: {
    type: 'collection',
    path: 'vms',
    fields: 'id,name_label,name_description,power_state,$container,$pool,other',
    handler: (record: XoVm) => record,
  },
  task: {
    type: 'collection',
    path: 'tasks',
    fields: 'id,start,end,properties,status,progress,tasks',
    handler: (record: XoTask) => record,
  },
  dashboard: {
    type: 'single',
    path: 'dashboard',
    fields: '*',
    handler: (record: XoDashboard) => record,
  },
  pif: {
    type: 'collection',
    path: 'pifs',
    fields: '$host,$network,attached,carrier,device,dns,gateway,id,ip,ipv6,mac,mode,mtu,netmask,speed',
    handler: (record: XoPif) => record,
  },
  network: {
    type: 'collection',
    path: 'networks',
    fields: 'id, defaultIsLocked,name_label,nbd,tags',
    handler: (record: XoNetwork) => record,
  },
  server: {
    type: 'collection',
    path: 'servers',
    fields: '*',
    handler: (record: XoServer) => record,
  },
} satisfies ApiDefinition
