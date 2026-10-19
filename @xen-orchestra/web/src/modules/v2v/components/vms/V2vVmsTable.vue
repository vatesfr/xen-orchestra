<template>
  <VtsTable :state :pagination-bindings :selection-bindings="selection.bindings">
    <thead>
      <tr>
        <DatastoreHeadCells v-if="view.type === 'datastore'" />
        <AllVmsHeadCells v-else />
      </tr>
    </thead>
    <tbody>
      <template v-if="view.type === 'datastore'">
        <VtsRow v-for="row of view.rows" :key="row.id" :selected="row.isSelected">
          <DatastoreBodyCells :item="row" />
        </VtsRow>
      </template>
      <template v-else>
        <VtsRow v-for="row of view.rows" :key="row.id" :selected="row.isSelected">
          <AllVmsBodyCells :item="row" />
        </VtsRow>
      </template>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import V2vDatastoresCell from '@/modules/v2v/components/vms/V2vDatastoresCell.vue'
import V2vVmNameCell from '@/modules/v2v/components/vms/V2vVmNameCell.vue'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vVmsTableSelection } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vVmDatastoreViewRow, V2vVmsTableView, V2vVmViewRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { PaginationBindings } from '@core/composables/pagination.composable.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useCollapsedListColumn } from '@core/tables/column-definitions/collapsed-list-column.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { h, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'

const { selection } = defineProps<{
  view: V2vVmsTableView
  selection: V2vVmsTableSelection
  state?: TableState
  paginationBindings?: PaginationBindings
}>()

const emit = defineEmits<{
  filterDatastore: [name: string]
}>()

const { powerLabels, getStatusTag } = useV2vVmLabels()

function setupColumns() {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    vm: useTextColumn({ headerLabel: () => t('vm') }),
    power: useTextColumn({ headerLabel: () => t('power-state') }),
    datastores: useTextColumn({ headerLabel: () => t('datastores') }),
    alsoOn: useCollapsedListColumn({ headerLabel: () => t('also-on') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    sizeOnDatastore: useNumberColumn({ headerLabel: () => t('size-on-this-datastore') }),
    migration: useTagColumn({ headerLabel: () => t('migration') }),
    lastSync: useDateColumn({ headerLabel: () => t('last-sync'), dateStyle: 'short', timeStyle: 'medium' }),
  }
}

type V2vVmColumns = ReturnType<typeof setupColumns>

type BodyRenderer<TColumnId extends keyof V2vVmColumns> = (renderer: V2vVmColumns[TColumnId]['renderBody']) => VNode

const useV2vVmColumns = defineColumns(setupColumns)

function renderSize(bytes: number, renderer: V2vVmColumns['size']['renderBody']) {
  const size = formatSizeRaw(bytes, 1)

  return renderer(size.value, size.prefix)
}

// `row` is the reactive item of its cells: read lazily, it follows the row an existing table line now shows
function getSharedCells(row: V2vVmViewRow): {
  checkbox: BodyRenderer<'checkbox'>
  vm: BodyRenderer<'vm'>
  migration: BodyRenderer<'migration'>
} {
  return {
    checkbox: renderer =>
      renderer({
        selected: row.isSelected,
        disabled: !row.isSelectable,
        onToggle: () => selection.toggle(row.id),
      }),
    vm: () => h(V2vVmNameCell, { name: row.name, isInList: row.isInList }),
    migration: renderer => {
      const tag = getStatusTag(row)

      return renderer(tag.label, tag.accent)
    },
  }
}

const head = () => ({
  checkbox: (renderer: V2vVmColumns['checkbox']['renderHead']) => renderer(selection.pageModel),
})

const { HeadCells: AllVmsHeadCells, BodyCells: AllVmsBodyCells } = useV2vVmColumns({
  exclude: ['alsoOn', 'sizeOnDatastore'],
  head,
  body: (row: V2vVmViewRow) => ({
    ...getSharedCells(row),
    power: renderer => renderer(powerLabels.value[row.power]),
    datastores: () =>
      h(V2vDatastoresCell, { names: row.datastore, onFilter: (name: string) => emit('filterDatastore', name) }),
    size: renderer => renderSize(row.size, renderer),
    lastSync: renderer => renderer(row.lastSyncAt),
  }),
})

const { HeadCells: DatastoreHeadCells, BodyCells: DatastoreBodyCells } = useV2vVmColumns({
  exclude: ['power', 'datastores', 'size', 'lastSync'],
  head,
  body: (row: V2vVmDatastoreViewRow) => ({
    ...getSharedCells(row),
    alsoOn: renderer => renderer(row.otherDatastores),
    sizeOnDatastore: renderer => renderSize(row.sizeOnDatastore, renderer),
  }),
})
</script>
