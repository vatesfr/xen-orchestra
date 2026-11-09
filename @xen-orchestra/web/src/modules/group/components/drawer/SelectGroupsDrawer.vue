<template>
  <UiDrawer @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="content">
        <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
        <VtsTable :state :pagination-bindings :selection-bindings>
          <thead>
            <tr>
              <HeadCells />
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="group of paginatedGroups" :key="group.id">
              <BodyCells :item="group" />
            </VtsRow>
          </tbody>
        </VtsTable>
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-group.') }}
        </UiInfo>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:add') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import {
  type FilterableGroup,
  useGroupQueryBuilder,
} from '@/modules/group/composables/use-group-query-builder.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { groups } = defineProps<{
  groups: FrontXoGroup[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [groups: FrontXoGroup[]]
  cancel: []
}>()

const { t } = useI18n()

const {
  items: filteredGroups,
  filter,
  schema,
} = useGroupQueryBuilder('select-groups', () => groups, {
  ignoreRoute: true,
})

const { pageRecords: paginatedGroups, paginationBindings } = usePagination('select-groups', filteredGroups, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    groups.length === 0 ? t('no-group-detected') : filteredGroups.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => groups,
  filteredItems: filteredGroups,
  pageItems: paginatedGroups,
  getItemId: group => group.id,
})

const hasTriedToConfirm = ref(false)

const isSelectionErrorVisible = computed(() => hasTriedToConfirm.value && selectedIds.value.length === 0)

function confirm() {
  hasTriedToConfirm.value = true

  if (selectedIds.value.length === 0) {
    return
  }

  emit(
    'confirm',
    groups.filter(group => selectedIds.value.includes(group.id))
  )
}

const { HeadCells, BodyCells } = useGroupColumns({
  exclude: ['selectItem', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (group: FilterableGroup) => ({
    checkbox: r => r({ selected: isSelected(group.id), onToggle: () => toggleSelection(group.id) }),
    name: r => r(group.name),
    provider: r => r(group.provider),
    users: r => r(group.usersCount),
    roles: r => r(group.rolesCount),
  }),
})
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
