import type {
  ObjectType,
  RawObjectType,
  RawTypeToType,
  RawXenApiRecord,
  TypeToRawType,
  XenApiRecord,
} from '@/libs/xen-api/xen-api.types'

export const XEN_API_OBJECT_TYPES = {
  bond: 'Bond',
  certificate: 'Certificate',
  cluster: 'Cluster',
  cluster_host: 'Cluster_host',
  dr_task: 'DR_task',
  feature: 'Feature',
  gpu_group: 'GPU_group',
  pbd: 'PBD',
  pci: 'PCI',
  pgpu: 'PGPU',
  pif: 'PIF',
  pif_metrics: 'PIF_metrics',
  pusb: 'PUSB',
  pvs_cache_storage: 'PVS_cache_storage',
  pvs_proxy: 'PVS_proxy',
  pvs_server: 'PVS_server',
  pvs_site: 'PVS_site',
  sdn_controller: 'SDN_controller',
  sm: 'SM',
  sr: 'SR',
  usb_group: 'USB_group',
  vbd: 'VBD',
  vbd_metrics: 'VBD_metrics',
  vdi: 'VDI',
  vgpu: 'VGPU',
  vgpu_type: 'VGPU_type',
  vif: 'VIF',
  vif_metrics: 'VIF_metrics',
  vlan: 'VLAN',
  vm: 'VM',
  vmpp: 'VMPP',
  vmss: 'VMSS',
  vm_appliance: 'VM_appliance',
  vm_guest_metrics: 'VM_guest_metrics',
  vm_metrics: 'VM_metrics',
  vusb: 'VUSB',
  blob: 'blob',
  console: 'console',
  crashdump: 'crashdump',
  host: 'host',
  host_cpu: 'host_cpu',
  host_crashdump: 'host_crashdump',
  host_metrics: 'host_metrics',
  host_patch: 'host_patch',
  message: 'message',
  network: 'network',
  network_sriov: 'network_sriov',
  pool: 'pool',
  pool_patch: 'pool_patch',
  pool_update: 'pool_update',
  role: 'role',
  secret: 'secret',
  subject: 'subject',
  task: 'task',
  tunnel: 'tunnel',
  vtpm: 'VTPM',
} as const

export const rawTypeToType = <RawType extends RawObjectType>(rawType: RawType): RawTypeToType<RawType> =>
  rawType.toLowerCase() as Lowercase<RawType>

export const typeToRawType = <Type extends ObjectType>(type: Type): TypeToRawType<Type> => XEN_API_OBJECT_TYPES[type]

export const buildXoObject = <T extends XenApiRecord<ObjectType>>(
  record: RawXenApiRecord<T>,
  params: { opaqueRef: T['$ref'] }
) => {
  return {
    ...record,
    $ref: params.opaqueRef,
  } as T
}
