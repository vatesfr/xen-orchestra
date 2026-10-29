import { useV2vMigrationListRows } from '@/modules/v2v/composables/use-v2v-migration-list-rows.composable.ts'
import { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
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
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { XoV2vVm } from '@vates/types'
import { compact } from 'lodash-es'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

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

// The mapping step shows one VM of the list at a time, the one of the route, beside the VMs of the list
export function useV2vMappingStep() {
  const connectionStore = useV2vConnectionStore()

  const router = useRouter()

  const { goToStep, getStepLocation } = useV2vWizardNavigation()

  const { getStatusTag } = useV2vVmLabels()

  const listRows = useV2vMigrationListRows()

  const { sourceHost, migrationList, listVmIds, rows } = listRows

  const requestedVmId = useRouteQuery<XoV2vVm['id']>('vm')

  const activeVmId = computed((): XoV2vVm['id'] | undefined =>
    listVmIds.value.includes(requestedVmId.value) ? requestedVmId.value : listVmIds.value[0]
  )

  // A missing or unknown VM in the route reads as the first VM of the list: the route says so, for the panel to select
  // it and for a reload to keep it
  watch(
    [activeVmId, requestedVmId],
    ([id, requestedId]) => {
      if (id !== undefined && id !== requestedId) {
        requestedVmId.value = id
      }
    },
    { immediate: true }
  )

  const selectedVms = useV2vSelectedVms({ ...listRows, activeVmId })

  // A VM gone from the source is only known to have been on it. A part the inventory cannot tell is left out
  function getLocationParts(row: V2vVmRow | undefined): string[] {
    const vmParts =
      row === undefined ? [] : [getV2vVmDatacenterName(connectionStore.inventory, row.vm), row.datastore.join(', ')]

    return compact([sourceHost.value, ...vmParts])
  }

  const activeVm = computed((): V2vMappingStepVm | undefined => {
    const selectedVm = selectedVms.activeVm.value
    const list = migrationList.list.value

    const isUnknown = selectedVms.isBusy.value || selectedVm === undefined || list === undefined

    if (isUnknown) {
      return undefined
    }

    const { id, name, kind, check, checkInfo } = selectedVm
    const row = rows.value.find(vmRow => vmRow.id === id)

    if (row === undefined) {
      return { kind: 'not-found', id, heading: { locationParts: getLocationParts(undefined), name } }
    }

    const heading = { locationParts: getLocationParts(row), name, statusTag: getStatusTag(row) }

    const { importVm } = row

    // Only a VM with an import VM is resumed
    if (kind === 'resume' && importVm !== undefined) {
      return { kind, id, heading, vm: row.vm, importVm, lastSyncAt: row.lastSyncAt }
    }

    return { kind: 'new', id, heading, vm: row.vm, list, listIssue: isV2vListIssue(check) ? checkInfo : undefined }
  })

  // The next VM of the list, or the previous one when it was the last
  function findNeighbourVmId(id: XoV2vVm['id']): XoV2vVm['id'] | undefined {
    const index = listVmIds.value.indexOf(id)

    return listVmIds.value[index + 1] ?? listVmIds.value[index - 1]
  }

  // The mapping moves to a neighbour before the active VM leaves the list: removed first, it would read as an unknown
  // VM of the route, and the mapping would jump to the first VM
  async function remove(id: XoV2vVm['id']) {
    if (!(await selectedVms.confirmRemove(id))) {
      return
    }

    if (id !== activeVmId.value) {
      migrationList.removeVm(id)

      return
    }

    const neighbourVmId = findNeighbourVmId(id)

    if (neighbourVmId === undefined) {
      migrationList.removeVm(id)

      return goToStep('vms')
    }

    await router.replace(getStepLocation('mapping', { vm: neighbourVmId }))
    migrationList.removeVm(id)
  }

  return {
    isBusy: selectedVms.isBusy,
    activeVm,
    updateVm: migrationList.updateVm,
    selectedVmsPanel: selectedVms.panel,
    remove,
    clear: selectedVms.clear,
    back: () => goToStep('vms'),
    next: () => goToStep('review'),
  }
}
