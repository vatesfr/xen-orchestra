import { useV2vIdQuery } from '@/modules/v2v/composables/use-v2v-id-query.composable.ts'
import { useV2vMigrationListRows } from '@/modules/v2v/composables/use-v2v-migration-list-rows.composable.ts'
import {
  useV2vSelectedVms,
  type V2vListedVm,
  type V2vSelectedVm,
} from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vVmLabels, type V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { isV2vListIssue } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { getV2vVmDatacenterName } from '@/modules/v2v/utils/v2v-source.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { XoV2vVm } from '@vates/types'
import { compact } from 'lodash-es'
import { computed } from 'vue'

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

// The mapping step lists the VMs of the list, the one of the route selected, if any
export function useV2vMappingStep() {
  const connectionStore = useV2vConnectionStore()

  const { goToStep } = useV2vWizardNavigation()

  const { getStatusTag } = useV2vVmLabels()

  const listRows = useV2vMigrationListRows()

  const { sourceHost, migrationList, listVmIds } = listRows

  const selectedVmId = useV2vIdQuery<XoV2vVm['id']>('vm')

  const selectedVms = useV2vSelectedVms({ ...listRows, selectedVmId })

  // A VM gone from the source is only known to have been on it. A part the inventory cannot tell is left out
  function getLocationParts(row: V2vVmRow | undefined): string[] {
    const vmParts =
      row === undefined ? [] : [getV2vVmDatacenterName(connectionStore.inventory, row.vm), row.datastore.join(', ')]

    return compact([sourceHost.value, ...vmParts])
  }

  function getStepVm({ kind, check, item }: V2vListedVm, list: V2vMigrationList): V2vMappingStepVm {
    const { id, name } = item
    const row = selectedVms.getRow(id)

    if (row === undefined) {
      return { kind: 'not-found', id, heading: { locationParts: getLocationParts(undefined), name } }
    }

    const heading = { locationParts: getLocationParts(row), name, statusTag: getStatusTag(row) }

    const { importVm } = row

    // Only a VM with an import VM is resumed
    if (kind === 'resume' && importVm !== undefined) {
      return { kind, id, heading, vm: row.vm, importVm, lastSyncAt: row.lastSyncAt }
    }

    return { kind: 'new', id, heading, vm: row.vm, list, listIssue: isV2vListIssue(check) ? item.check : undefined }
  }

  // Until the rows and the pool offers are ready, a VM would read as new and its mapping as incomplete
  const rows = computed((): V2vMappingStepRow[] => {
    const list = migrationList.list.value

    if (selectedVms.isBusy.value || list === undefined) {
      return []
    }

    return selectedVms.vms.value.map(listedVm => ({ item: listedVm.item, vm: getStepVm(listedVm, list) }))
  })

  const selectedVm = computed(() => rows.value.find(row => row.vm.id === selectedVmId.value)?.vm)

  function select(id: XoV2vVm['id']) {
    selectedVmId.value = id
  }

  function close() {
    selectedVmId.value = undefined
  }

  // An empty list has nothing left to map
  async function remove(id: XoV2vVm['id']) {
    if (!(await selectedVms.confirmRemove(id))) {
      return
    }

    migrationList.removeVm(id)

    if (listVmIds.value.length === 0) {
      return goToStep('vms')
    }

    if (id === selectedVmId.value) {
      close()
    }
  }

  return {
    isBusy: selectedVms.isBusy,
    rows,
    selectedVm,
    updateVm: migrationList.updateVm,
    select,
    close,
    remove,
    back: () => goToStep('vms'),
    next: () => goToStep('review'),
  }
}
