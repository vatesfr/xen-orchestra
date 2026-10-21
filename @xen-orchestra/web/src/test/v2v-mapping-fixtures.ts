import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vDisk, createV2vNic, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import type { XoV2vDisk, XoV2vNic } from '@vates/types'

const DEFAULTS = createV2vDestinationDefaults()

// The system disk went through a snapshot: its chain is the base disk, then the snapshot delta
export const V2V_SYSTEM_DISK = createV2vDisk({
  key: 'scsi0:0' as XoV2vDisk['key'],
  chainPaths: ['app-03/app-03.vmdk', 'app-03/app-03-000001.vmdk'],
})

export const V2V_DATA_DISK = createV2vDisk({
  key: 'scsi0:1' as XoV2vDisk['key'],
  label: 'Hard disk 2',
  chainPaths: ['app-03/app-03_1.vmdk'],
})

export const V2V_LAN_NIC = createV2vNic({ key: 'nic-4000' as XoV2vNic['key'], macAddress: '00:50:56:ab:cd:01' })

export const V2V_VLAN_NIC = createV2vNic({
  key: 'nic-4001' as XoV2vNic['key'],
  label: 'Network adapter 2',
  macAddress: '00:50:56:00:00:02',
})

export const V2V_MAPPED_VM = createV2vVm({ disks: [V2V_SYSTEM_DISK, V2V_DATA_DISK], nics: [V2V_LAN_NIC, V2V_VLAN_NIC] })

export const V2V_DEFAULT_SR = createSr({ id: DEFAULTS.sr, name_label: 'sr-nvme-01' })

export const V2V_SSD_SR = createSr({ id: 'sr-ssd' as FrontXoSr['id'], name_label: 'sr-ssd-01' })

export const V2V_DEFAULT_NETWORK = createNetwork({ id: DEFAULTS.network, name_label: 'VLAN 10' })

export const V2V_VLAN_NETWORK = createNetwork({ id: 'network-vlan' as FrontXoNetwork['id'], name_label: 'VLAN 20' })

export const V2V_DISK_OVERRIDES = { [V2V_DATA_DISK.key]: V2V_SSD_SR.id } as V2vMigrationListVm['disks']

export const V2V_NIC_OVERRIDES = { [V2V_VLAN_NIC.key]: V2V_VLAN_NETWORK.id } as V2vMigrationListVm['nics']

export const V2V_DEFAULT_TEMPLATE = createVmTemplate({ id: DEFAULTS.template })

export const V2V_DEBIAN_TEMPLATE = createVmTemplate({
  id: 'template-debian' as FrontXoVmTemplate['id'],
  name_label: 'Debian 12',
})

// The pool offers the defaults of the list and one other target of each kind
export const V2V_POOL_OFFERS: V2vPoolDestinationChoices = {
  srs: [V2V_DEFAULT_SR, V2V_SSD_SR],
  networks: [V2V_DEFAULT_NETWORK, V2V_VLAN_NETWORK],
  templates: [V2V_DEFAULT_TEMPLATE, V2V_DEBIAN_TEMPLATE],
}
