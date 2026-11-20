<template>
  <VtsLayoutSidebar side="right" class="my-tasks-sidebar">
    <template #header>
      <div class="header">
        <div class="title">
          <span class="typo-body-bold">{{ t('tasks:my-tasks') }}</span>
          <UiLink size="small" :to="{ name: '/(site)/tasks' }">{{ t('tasks:see-all') }}</UiLink>
        </div>
        <MenuList placement="bottom-end">
          <template #trigger="{ open, bindings }">
            <UiButtonIcon
              v-tooltip="t('more-actions')"
              v-bind="bindings"
              icon="action:more-actions"
              accent="brand"
              size="small"
              :aria-label="t('more-actions')"
              @click="open($event)"
            />
          </template>
          <MenuItem icon="action:read" accent="neutral" :disabled="unreadCount === 0" :on-click="markAllAsRead">
            {{ t('tasks:mark-all-as-read') }}
          </MenuItem>
        </MenuList>
      </div>
    </template>

    <template #subheader>
      <div class="search">
        <UiInput
          v-model="filter"
          :aria-label="t('tasks:search-in-my-tasks')"
          :placeholder="t('tasks:search-in-my-tasks')"
          right-icon="fa:magnifying-glass"
          accent="brand"
          clearable
        />
      </div>
    </template>

    <VtsStateHero v-if="hasTaskFetchError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!areTasksReady || isSearching" format="panel" type="busy" size="medium" />
    <VtsTaskList
      v-else-if="displayedTasks.length > 0"
      class="tasks"
      :tasks="displayedTasks"
      :selected-task-id="openedTaskId"
      :expand-all="hasFilter"
      :unread-task-ids
    />
    <VtsStateHero v-else format="card" type="no-result" size="medium">
      {{ hasFilter ? t('no-result') : t('no-task') }}
    </VtsStateHero>
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useDebouncedRef } from '@core/composables/debounced-ref.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { filterTasksByName } from '@core/utils/task.util.ts'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const route = useRoute()
const rightSidebar = useRightSidebarStore()
const uiStore = useUiStore()

watch(
  () => route.fullPath,
  () => {
    if (uiStore.isSmall) {
      rightSidebar.toggleExpand(false)
    }
  }
)

const { value: filter, debouncedValue: debouncedFilter, isDebouncing: isSearching } = useDebouncedRef('', 500)

const hasFilter = computed(() => debouncedFilter.value.trim().length > 0)

const { lastDayTasks, areTasksReady, hasTaskFetchError } = useXoTaskCollection()

const displayedTasks = computed(() => filterTasksByName(lastDayTasks.value, debouncedFilter.value))

const { openedTaskId, unreadTaskIds, unreadCount, markAllAsRead } = useXoTasksUnread()
</script>

<style lang="postcss" scoped>
.my-tasks-sidebar {
  background-color: var(--color-neutral-background-primary);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    height: 4rem;

    .title {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }

  .search {
    padding: 0.4rem;
  }

  .tasks {
    overflow-x: auto;
    overflow-y: hidden;
    padding-inline: 0.4rem 0.8rem;
  }
}
</style>
