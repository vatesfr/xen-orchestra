<template>
  <div class="privilege-scope-objects-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="object of paginatedObjects" :key="object.id">
          <BodyCells :item="object" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeSelection } from '@/modules/role/composables/use-privilege-scope-selection.composable.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { usePrivilegeScopeObjectColumns } from '@core/tables/column-sets/privilege-scope-object-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { useI18n } from 'vue-i18n'

// For the resources without a dedicated table in XO 6: the objects are only listed by name.
const { tableId, objects, isReady, hasError, emptyMessage } = defineProps<{
  tableId: string
  objects: PrivilegeScopeObject[]
  isReady: boolean
  hasError: boolean
  emptyMessage: string
}>()

const selectedIds = defineModel<string[]>('selectedIds', { required: true })

const { t } = useI18n()

const { items: filteredObjects, filter } = useQueryBuilderFilter(tableId, () => objects, { ignoreRoute: true })

const schema = useQueryBuilderSchema<PrivilegeScopeObject>({
  '': useStringSchema(t('any-property')),
  label: useStringSchema(t('name')),
})

const state = useTableState({
  busy: () => !isReady,
  error: () => hasError,
  empty: () =>
    objects.length === 0 ? emptyMessage : filteredObjects.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedObjects, paginationBindings } = usePagination(tableId, filteredObjects, {
  ignoreRoute: true,
})

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = usePrivilegeScopeSelection({
  selectedIds,
  items: () => objects,
  filteredItems: filteredObjects,
  pageItems: paginatedObjects,
  isReady: () => isReady,
})

const { HeadCells, BodyCells } = usePrivilegeScopeObjectColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (object: PrivilegeScopeObject) => ({
    checkbox: r => r({ selected: isSelected(object.id), onToggle: () => toggleSelection(object.id) }),
    object: r => r({ label: object.label, to: object.to, icon: object.icon }),
  }),
})
</script>

<style lang="postcss" scoped>
.privilege-scope-objects-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
