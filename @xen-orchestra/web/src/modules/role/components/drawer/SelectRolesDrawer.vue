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
            <VtsRow v-for="role of paginatedRoles" :key="role.id">
              <BodyCells :item="role" />
            </VtsRow>
          </tbody>
        </VtsTable>
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-role.') }}
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
  type FilterableRole,
  useRoleQueryBuilder,
} from '@/modules/role/composables/use-role-query-builder.composable.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
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
import { useRoleColumns } from '@core/tables/column-sets/role-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { roles } = defineProps<{
  roles: FrontXoRole[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [roles: FrontXoRole[]]
  cancel: []
}>()

const { t } = useI18n()

const {
  items: filteredRoles,
  filter,
  schema,
} = useRoleQueryBuilder('select-roles', () => roles, {
  ignoreRoute: true,
})

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('select-roles', filteredRoles, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    roles.length === 0 ? t('no-role-detected') : filteredRoles.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => roles,
  filteredItems: filteredRoles,
  pageItems: paginatedRoles,
  getItemId: role => role.id,
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
    roles.filter(role => selectedIds.value.includes(role.id))
  )
}

const { HeadCells, BodyCells } = useRoleColumns({
  exclude: ['group', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (role: FilterableRole) => ({
    checkbox: r => r({ selected: isSelected(role.id), onToggle: () => toggleSelection(role.id) }),
    name: r => r(role.name),
    description: r => r(role.description),
    users: r => r(role.usersCount),
    groups: r => r(role.groupsCount),
    privileges: r => r(role.privilegesCount),
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
