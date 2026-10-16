<template>
  <VtsTable :state :pagination-bindings>
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
</template>

<script lang="ts" setup>
import { usePrivilegeScopeObjects } from '@/modules/role/composables/use-privilege-scope-objects.composable.ts'
import type { PrivilegeSelectorMatch } from '@/modules/role/remote-resources/use-xo-privilege-selector-matches-collection.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { usePrivilegeScopeObjectColumns } from '@core/tables/column-sets/privilege-scope-object-columns.ts'
import { computed } from 'vue'

const { resource, matches, isReady, hasError } = defineProps<{
  resource: SelectablePrivilegeResource
  matches: PrivilegeSelectorMatch[]
  isReady: boolean
  hasError: boolean
}>()

// The matches only carry a name: the scope objects provide the icon and the link of each of them.
const { objects, isReady: areObjectsReady } = usePrivilegeScopeObjects(() => resource)

const objectsById = computed(() => new Map(objects.value.map(object => [object.id, object])))

const matchedObjects = computed<PrivilegeScopeObject[]>(() =>
  matches.map(match => objectsById.value.get(match.id) ?? { id: match.id, label: match.name })
)

const state = useTableState({
  busy: () => !isReady || !areObjectsReady.value,
  error: () => hasError,
  empty: () => (matches.length === 0 ? { type: 'no-result' } : false),
})

const { pageRecords: paginatedObjects, paginationBindings } = usePagination('privilege-scope-preview', matchedObjects, {
  ignoreRoute: true,
})

const { HeadCells, BodyCells } = usePrivilegeScopeObjectColumns({
  exclude: ['checkbox'],
  body: (object: PrivilegeScopeObject) => ({
    object: r => r({ label: object.label, to: object.to, icon: object.icon }),
  }),
})
</script>
