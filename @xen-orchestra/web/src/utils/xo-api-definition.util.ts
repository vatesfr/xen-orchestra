import type { ApiDefinition } from '@/types/xo'
import type { XoDashboard } from '@/types/xo/dashboard.type'
import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type'
import type { XoTask } from '@/types/xo/task.type'
import type { XoVbd } from '@/types/xo/vbd.type'
import type { XoVdi } from '@/types/xo/vdi.type'
import type { XoVif } from '@/types/xo/vif.type'
import type { XoVmController } from '@/types/xo/vm-controller.type'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import type { XoVm } from '@/types/xo/vm.type'

export const xoApiDefinition = {
  pool: {
    type: 'collection',
    path: 'pools',
    fields: 'id,name_label,master,default_SR',
    handler: (record: XoPool) => record,
  },
  host: {
    type: 'collection',
    path: 'hosts',
    fields:
      'id,name_label,name_description,power_state,controlDomain,residentVms,$pool,current_operations,address,startTime,version,bios_strings,cpus,CPUs,memory,tags,iscsiIqn,powerOnMode,build,otherConfig,multipathing,logging,enabled,agentStartTime,PGPUs',
    handler: (record: XoHost) => record,
  },
  vm: {
    type: 'collection',
    path: 'vms',
    fields:
      'id,name_label,name_description,power_state,$container,$pool,other,current_operations,CPUs,addresses,tags,os_version,virtualizationMode,secureBoot,VTPMs,viridian,isNestedVirtEnabled,memory,VGPUs,high_availability,auto_poweron,startDelay,vga,videoram,pvDriversVersion,cpuWeight,cpuCap,cpuMask,coresPerSocket,nicType,affinityHost,suspendSr,blockedOperations,hasVendorDevice',
    handler: (record: XoVm) => record,
  },
  sr: {
    type: 'collection',
    path: 'srs',
    fields: 'id,name_label,name_description,$pool,content_type,physical_usage,size,SR_type,VDIs',
    handler: (record: XoSr) => record,
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
    fields:
      '$host,$network,attached,carrier,device,dns,gateway,id,ip,ipv6,mac,management,mode,mtu,netmask,speed,vlan,isBondMaster,bondSlaves',
    handler: (record: XoPif) => record,
  },
  vbd: {
    type: 'collection',
    path: 'vbds',
    fields: 'id,name_label,name_description,VDI,is_cd_drive,position',
    handler: (record: XoVbd) => record,
  },
  vdi: {
    type: 'collection',
    path: 'vdis',
    fields: 'id,name_label,name_description,$VBDs,$SR,size,$pool',
    handler: (record: XoVdi) => record,
  },
  vif: {
    type: 'collection',
    path: 'vifs',
    fields: '$VM,$network,attached,device,txChecksumming,id,lockingMode,MAC,MTU',
    handler: (record: XoVif) => record,
  },
  network: {
    type: 'collection',
    path: 'networks',
    fields: 'id,defaultIsLocked,name_label,nbd,tags,$pool,name_description,MTU,PIFs,other_config',
    handler: (record: XoNetwork) => record,
  },
  vm_template: {
    type: 'collection',
    path: 'vm-templates',
    fields:
      'id,uuid,name_label,name_description,$pool,template_info,VIFs,$VBDs,boot,CPUs,memory,tags,isDefaultTemplate',
    handler: (record: XoVmTemplate) => record,
  },
  'vm-controller': {
    type: 'collection',
    path: 'vm-controllers',
    fields: 'id,memory',
    handler: (record: XoVmController) => record,
  },
} satisfies ApiDefinition
