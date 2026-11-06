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
            <VtsRow v-for="user of paginatedUsers" :key="user.id">
              <BodyCells :item="user" />
            </VtsRow>
          </tbody>
        </VtsTable>
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-user.') }}
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
  type FilterableUser,
  useUserQueryBuilder,
} from '@/modules/user/composables/use-user-query-builder.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserDisplayName } from '@/modules/user/utils/xo-user.util.ts'
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
import { useUserColumns } from '@core/tables/column-sets/user-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [users: FrontXoUser[]]
  cancel: []
}>()

const { t } = useI18n()

const {
  items: filteredUsers,
  filter,
  schema,
} = useUserQueryBuilder('select-users', () => users, {
  ignoreRoute: true,
})

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('select-users', filteredUsers, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    users.length === 0 ? t('no-user-detected') : filteredUsers.value.length === 0 ? { type: 'no-result' } : false,
})

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => users,
  filteredItems: filteredUsers,
  pageItems: paginatedUsers,
  getItemId: user => user.id,
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
    users.filter(user => selectedIds.value.includes(user.id))
  )
}

const { HeadCells, BodyCells } = useUserColumns({
  exclude: ['actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (user: FilterableUser) => ({
    checkbox: r => r({ selected: isSelected(user.id), onToggle: () => toggleSelection(user.id) }),
    username: r => r(getUserDisplayName(user)),
    firstName: r => r(user.firstname),
    lastName: r => r(user.lastname),
    email: r => r(user.email),
    providers: r => r(user.providers),
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
