import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vActiveMappingRow, V2vDiskMappingRow, V2vNicMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import {
  createV2vDisk,
  createV2vHost,
  createV2vInventory,
  createV2vNic,
  createV2vPortGroup,
  createV2vVm,
} from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVif } from '@/test/create-vif.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { t } from '@/test/i18n.ts'
import { V2V_VDI_OTHER_CONFIG, V2V_VM_OTHER_CONFIG, VM_POWER_STATE, type XoV2vDisk, type XoV2vNic } from '@vates/types'

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

export const V2V_PROD_PORT_GROUP = createV2vPortGroup()

export const V2V_LAN_NIC = createV2vNic({
  key: 'nic-4000' as XoV2vNic['key'],
  portGroupId: V2V_PROD_PORT_GROUP.id,
  macAddress: '00:50:56:ab:cd:01',
})

export const V2V_VLAN_NIC = createV2vNic({
  key: 'nic-4001' as XoV2vNic['key'],
  label: 'Network adapter 2',
  macAddress: '00:50:56:00:00:02',
})

export const V2V_MAPPED_VM = createV2vVm({ disks: [V2V_SYSTEM_DISK, V2V_DATA_DISK], nics: [V2V_LAN_NIC, V2V_VLAN_NIC] })

// The source the mapped VM is read from: its host, its datastore and the port group of its first NIC
export const V2V_MAPPING_INVENTORY = createV2vInventory({
  hosts: [createV2vHost()],
  portGroups: [V2V_PROD_PORT_GROUP],
  vms: [V2V_MAPPED_VM],
})

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

// The pool offers the defaults of the list alone: a VM mapped on them has a complete mapping
export const V2V_DEFAULT_OFFERS: V2vPoolDestinationChoices = {
  srs: [V2V_DEFAULT_SR],
  networks: [V2V_DEFAULT_NETWORK],
  templates: [V2V_DEFAULT_TEMPLATE],
}

// The pool offers the defaults of the list and one other target of each kind
export const V2V_POOL_OFFERS: V2vPoolDestinationChoices = {
  srs: [V2V_DEFAULT_SR, V2V_SSD_SR],
  networks: [V2V_DEFAULT_NETWORK, V2V_VLAN_NETWORK],
  templates: [V2V_DEFAULT_TEMPLATE, V2V_DEBIAN_TEMPLATE],
}

function toOptionsByName<TId>(offers: { id: TId; name_label: string }[]) {
  return offers.map(({ id, name_label }) => ({ id, label: name_label }))
}

// The pool offers as their selects list them, by name
export const V2V_TARGET_OPTIONS = {
  srs: toOptionsByName(V2V_POOL_OFFERS.srs),
  networks: toOptionsByName(V2V_POOL_OFFERS.networks),
  templates: toOptionsByName(V2V_POOL_OFFERS.templates),
}

// The rows of the mapped VM, its list VM overriding its second disk and its second NIC
export const V2V_DISK_ROWS: V2vDiskMappingRow[] = [
  {
    key: V2V_SYSTEM_DISK.key,
    label: V2V_SYSTEM_DISK.label,
    datastore: 'ds-prod-01',
    size: V2V_SYSTEM_DISK.capacity,
    sr: { value: V2V_DEFAULT_SR.id, origin: 'default', isOffered: true },
  },
  {
    key: V2V_DATA_DISK.key,
    label: V2V_DATA_DISK.label,
    datastore: 'ds-prod-01',
    size: V2V_DATA_DISK.capacity,
    sr: { value: V2V_SSD_SR.id, origin: 'overridden', isOffered: true },
  },
]

export const V2V_NIC_ROWS: V2vNicMappingRow[] = [
  {
    key: V2V_LAN_NIC.key,
    label: V2V_LAN_NIC.label,
    portGroupParts: [V2V_PROD_PORT_GROUP.name, t('vlan-id', { id: V2V_PROD_PORT_GROUP.vlan })],
    macAddress: V2V_LAN_NIC.macAddress,
    network: { value: V2V_DEFAULT_NETWORK.id, origin: 'default', isOffered: true },
  },
  {
    key: V2V_VLAN_NIC.key,
    label: V2V_VLAN_NIC.label,
    portGroupParts: [],
    macAddress: V2V_VLAN_NIC.macAddress,
    network: { value: V2V_VLAN_NETWORK.id, origin: 'overridden', isOffered: true },
  },
]

// The first sync of the mapped VM put its system disk, last synced from its snapshot delta, on the SSD SR, and its NICs
// on the devices 0 and 1, the MAC of the second one changed. Its data disk is not paired: no VDI of the import has it
export const V2V_SYNCED_VDI = createVdi({
  id: 'vdi-system' as FrontXoVdi['id'],
  $SR: V2V_SSD_SR.id,
  other_config: { [V2V_VDI_OTHER_CONFIG.DISK_PATH]: V2V_SYSTEM_DISK.chainPaths[1] },
})

export const V2V_SYNCED_VBD = createVbd({ id: 'vbd-system' as FrontXoVbd['id'], VDI: V2V_SYNCED_VDI.id })

export const V2V_SYNCED_VIFS = [
  createVif({
    id: 'vif-lan' as FrontXoVif['id'],
    device: '0',
    $network: V2V_DEFAULT_NETWORK.id,
    MAC: V2V_LAN_NIC.macAddress,
  }),
  createVif({
    id: 'vif-vlan' as FrontXoVif['id'],
    device: '1',
    $network: V2V_VLAN_NETWORK.id,
    MAC: '00:16:3e:00:00:02',
  }),
]

export const V2V_RESUMED_IMPORT_VM = createV2vImportVm(
  { sourceVmId: V2V_MAPPED_VM.id },
  {
    name_label: 'app-03',
    power_state: VM_POWER_STATE.HALTED,
    $VBDs: [V2V_SYNCED_VBD.id],
    VIFs: V2V_SYNCED_VIFS.map(vif => vif.id),
  }
)

// The source VM still holds the snapshot its import last synced
export const V2V_SYNCED_VM = createV2vVm({
  ...V2V_MAPPED_VM,
  currentSnapshotId: V2V_RESUMED_IMPORT_VM.other[V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID],
})

// The rows of the active mapping of the resumed VM: its disks then its NICs
export const V2V_ACTIVE_MAPPING_ROWS: V2vActiveMappingRow[] = [
  {
    key: V2V_SYSTEM_DISK.key,
    source: V2V_SYSTEM_DISK.label,
    detailParts: ['ds-prod-01', '80 GiB'],
    destination: V2V_SSD_SR.name_label,
  },
  { key: V2V_DATA_DISK.key, source: V2V_DATA_DISK.label, detailParts: ['ds-prod-01', '80 GiB'] },
  {
    key: V2V_LAN_NIC.key,
    source: V2V_LAN_NIC.label,
    detailParts: [V2V_PROD_PORT_GROUP.name, t('vlan-id', { id: V2V_PROD_PORT_GROUP.vlan }), t('v2v:mac-kept')],
    destination: V2V_DEFAULT_NETWORK.name_label,
  },
  { key: V2V_VLAN_NIC.key, source: V2V_VLAN_NIC.label, detailParts: [], destination: V2V_VLAN_NETWORK.name_label },
]
