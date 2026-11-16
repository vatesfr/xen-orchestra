import type { V2vAccentedLabel } from '@/modules/v2v/types/v2v-accented-label.type.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vSelectedVm } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { XoV2vVm } from '@vates/types'

// Where the VM is on the source (host, datacenter, datastores), its name and its migration status
export type V2vMappingVmHeading = {
  locationParts: string[]
  name: string
  statusTag?: V2vAccentedLabel<TagAccent>
}

// A new VM is mapped on the list, a resumed one keeps the mapping of its first sync, a VM gone from the source has none
export type V2vMappingStepVm =
  | { kind: 'not-found'; id: XoV2vVm['id']; heading: V2vMappingVmHeading }
  | {
      kind: 'new'
      id: XoV2vVm['id']
      heading: V2vMappingVmHeading
      vm: XoV2vVm
      list: V2vMigrationList
      listIssue?: V2vAccentedLabel<InfoAccent>
    }
  | {
      kind: 'resume'
      id: XoV2vVm['id']
      heading: V2vMappingVmHeading
      vm: XoV2vVm
      importVm: FrontXoVm
      lastSyncAt?: number
    }

export type V2vNewMappingStepVm = Extract<V2vMappingStepVm, { kind: 'new' }>

export type V2vResumedMappingStepVm = Extract<V2vMappingStepVm, { kind: 'resume' }>

export type V2vNotFoundMappingStepVm = Extract<V2vMappingStepVm, { kind: 'not-found' }>

// A row of the mapping table: the VM of the list, its item of the selected VMs beside it
export type V2vMappingStepRow = {
  item: V2vSelectedVm
  vm: V2vMappingStepVm
}
