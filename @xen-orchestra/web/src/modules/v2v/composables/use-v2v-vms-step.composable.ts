import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import type { V2vSelectedVmsContext } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vVmQueryBuilder } from '@/modules/v2v/composables/use-v2v-vm-query-builder.composable.ts'
import { useV2vVmRows } from '@/modules/v2v/composables/use-v2v-vm-rows.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  applyV2vPreset,
  countV2vPresets,
  getActiveV2vPreset,
  V2V_VM_PRESETS,
  type V2vVmPresetId,
} from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import {
  buildV2vVmsTableView,
  countV2vRowsByStatus,
  isV2vVmRowSelectable,
} from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import { getFilterPropertyValues, setFilterProperty } from '@/shared/utils/query-builder-filter.util.ts'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { type SelectionBindings, useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type V2vVmPreset = {
  id: V2vVmPresetId
  label: string
  count: number
  isActive: boolean
}

export type V2vDatastoreSummary = {
  chipLabel: string
  summaryLabels: string[]
}

export type V2vVmsTableSelection = {
  bindings: SelectionBindings
  pageModel: Ref<boolean | undefined>
  toggle: (id: V2vVmRow['id']) => void
}

const DATASTORE_PROPERTY = 'datastore'

export function useV2vVmsStep() {
  const { t } = useI18n()

  const connectionStore = useV2vConnectionStore()

  const { goToStep } = useV2vWizardNavigation()

  const { presetLabels, getSummaryLabels } = useV2vVmLabels()

  const pool = useV2vPoolQuery()

  const sourceHost = computed(() => connectionStore.connection?.host)

  const migrationList = useV2vMigrationList(() => connectionStore.sourceId, pool)

  const listVmIds = computed(() => new Set(migrationList.list.value?.vms.map(vm => vm.id)))

  const { rows, areRowsReady } = useV2vVmRows(listVmIds)

  const datastores = computed(() => connectionStore.inventory?.datastores ?? [])

  const {
    items: filteredRows,
    filter,
    schema,
  } = useV2vVmQueryBuilder('v2v-vms', rows, () => datastores.value.map(datastore => datastore.name))

  const { pageRecords: pageRows, paginationBindings } = usePagination('v2v-vms', filteredRows)

  // Only selectable rows are items: the filter and the page only narrow them, so the header checkbox and "Select all"
  // can never pick a disabled one
  const { selectedIds, isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useTableSelection({
    items: () => rows.value.filter(isV2vVmRowSelectable),
    filteredItems: filteredRows,
    pageItems: pageRows,
    getItemId: row => row.id,
  })

  const selection = computed(
    (): V2vVmsTableSelection => ({
      bindings: selectionBindings.value,
      pageModel: pageSelectionModel,
      toggle: toggleSelection,
    })
  )

  const canAddSelected = computed(() => selectionBindings.value.selectedCount > 0)

  const tableState = useTableState({
    busy: () => !areRowsReady.value,
    empty: () => {
      if (rows.value.length === 0) {
        return t('no-vm-detected')
      }

      return filteredRows.value.length === 0 ? { type: 'no-result' } : false
    },
  })

  // The added VMs leave the selectable rows, but keep their flag: cleared, they are not selected again once removed
  // from the list
  function addSelected() {
    // useTableSelection types its ids loosely: they are the row ids `getItemId` gave it
    migrationList.addVms(selectedIds.value as V2vVmRow['id'][])
    selectionBindings.value.onClearSelection()
  }

  // A datastore view needs a single datastore to show: several names, or one the inventory lacks, is a plain filter
  const activeDatastore = computed(() => {
    const [name, ...otherNames] = getFilterPropertyValues(filter.value, DATASTORE_PROPERTY)

    if (otherNames.length > 0) {
      return undefined
    }

    return datastores.value.find(datastore => datastore.name === name)
  })

  const tableView = computed(() => buildV2vVmsTableView(pageRows.value, activeDatastore.value, isSelected))

  // It describes the datastore itself: the rest of the filter narrows the table, not the VMs on the datastore
  const datastoreSummary = computed((): V2vDatastoreSummary | undefined => {
    const datastore = activeDatastore.value

    if (datastore === undefined) {
      return undefined
    }

    const datastoreRows = rows.value.filter(row => row.datastore.includes(datastore.name))

    return {
      chipLabel: `${DATASTORE_PROPERTY}:${datastore.name}`,
      summaryLabels: getSummaryLabels({ total: datastoreRows.length, counts: countV2vRowsByStatus(datastoreRows) }),
    }
  })

  function filterByDatastore(name: string) {
    filter.value = setFilterProperty(filter.value, DATASTORE_PROPERTY, name)
  }

  function removeDatastoreFilter() {
    filter.value = setFilterProperty(filter.value, DATASTORE_PROPERTY, undefined)
  }

  function clearFilter() {
    filter.value = ''
  }

  const presets = computed((): V2vVmPreset[] => {
    const counts = countV2vPresets(rows.value, filter.value)
    const activePresetId = getActiveV2vPreset(filter.value)

    return V2V_VM_PRESETS.map(id => ({
      id,
      label: presetLabels.value[id],
      count: counts[id],
      isActive: id === activePresetId,
    }))
  })

  function applyPreset(id: V2vVmPresetId) {
    filter.value = applyV2vPreset(filter.value, id)
  }

  const canGoNext = computed(() => listVmIds.value.size > 0)

  const selectedVmsContext: V2vSelectedVmsContext = { migrationList, rows, poolId: pool, sourceHost }

  return {
    sourceHost,
    filter,
    schema,
    tableView,
    paginationBindings,
    tableState,
    selection,
    canAddSelected,
    addSelected,
    datastoreSummary,
    filterByDatastore,
    removeDatastoreFilter,
    clearFilter,
    presets,
    applyPreset,
    canGoNext,
    back: () => goToStep('destination'),
    next: () => goToStep('mapping'),
    selectedVmsContext,
  }
}
