<template>
  <div class="v2v-mapping-table">
    <UiTitle>{{ t('selected-vms') }}</UiTitle>
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row of pageRows" :key="row.vm.id" :selected="row.item.isSelected">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import V2vMappingRowMenu from '@/modules/v2v/components/mapping/V2vMappingRowMenu.vue'
import type { V2vMappingStepRow } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmUpdate } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { renderInlinePartsCell } from '@/shared/utils/inline-parts-cell.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useInfoColumn } from '@core/tables/column-definitions/info-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import type { XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rows, updateVm } = defineProps<{
  rows: V2vMappingStepRow[]
  updateVm: V2vVmUpdate
}>()

const emit = defineEmits<{
  select: [id: XoV2vVm['id']]
  remove: [id: XoV2vVm['id']]
}>()

const { t } = useI18n()

const { pageRecords: pageRows, paginationBindings } = usePagination('v2v-mapping-vms', () => rows)

const state = useTableState({
  empty: () => (rows.length === 0 ? t('v2v:no-vm-in-list') : false),
})

const useMappingColumns = defineColumns(() => ({
  vm: useTextColumn({ headerLabel: () => t('vm') }),
  kind: useTagColumn({ headerLabel: () => t('type') }),
  mapping: useTextColumn({ headerLabel: () => t('mapping') }),
  check: useInfoColumn({ headerLabel: () => t('checks') }),
  actions: useActionColumn({}),
}))

// The kind of a VM changes once the import VM of a resumed VM is deleted: its row menu reads the actions of its kind
const { HeadCells, BodyCells } = useMappingColumns({
  body: (row: V2vMappingStepRow) => ({
    vm: renderer => renderer(row.item.name),
    kind: renderer => renderer(row.item.kind?.label ?? [], row.item.kind?.accent),
    mapping: () => renderInlinePartsCell(row.item.mappingParts),
    check: renderer => renderer(row.item.check.label, row.item.check.accent),
    actions: renderer =>
      renderer({
        onClick: () => emit('select', row.vm.id),
        component: V2vMappingRowMenu,
        props: { vm: row.vm, updateVm, onRemove: (id: XoV2vVm['id']) => emit('remove', id) },
      }),
  }),
})
</script>

<style lang="postcss" scoped>
.v2v-mapping-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
