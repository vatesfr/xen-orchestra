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
          v-model="search"
          :aria-label="t('tasks:search-in-my-tasks')"
          :placeholder="t('tasks:search-in-my-tasks')"
          right-icon="fa:magnifying-glass"
          accent="neutral"
          clearable
        />
      </div>
    </template>

    <template v-if="isTasksListRendered">
      <VtsStateHero v-if="hasTaskFetchError" format="card" type="error" size="medium">
        {{ t('error-no-data') }}
      </VtsStateHero>
      <VtsStateHero v-else-if="!areTasksReady || isSearching" format="panel" type="busy" size="medium" />
      <VtsTaskList
        v-else-if="displayedTasks.length > 0"
        :tasks="displayedTasks"
        :selected-task-id="openedTaskId"
        :expand-all="hasSearch"
        :unread-task-ids
      />
      <VtsStateHero v-else format="card" type="no-result" size="medium">
        {{ hasSearch ? t('no-result') : t('no-task') }}
      </VtsStateHero>
    </template>
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
import { useDebouncedSearch } from '@core/composables/debounced-search.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { SIDEBAR_TRANSITION_DURATION, useRightSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { filterTasksByName } from '@core/utils/task.util.ts'
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
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

const isTasksListRendered = ref(rightSidebar.isExpanded)

const { start: hideContentAfterSlide, stop: cancelHideContent } = useTimeoutFn(
  () => {
    isTasksListRendered.value = false
  },
  SIDEBAR_TRANSITION_DURATION,
  { immediate: false }
)

watch(
  () => rightSidebar.isExpanded,
  isExpanded => {
    if (isExpanded) {
      cancelHideContent()
      isTasksListRendered.value = true
    } else {
      hideContentAfterSlide()
    }
  }
)

const { search, debouncedSearch, isSearching } = useDebouncedSearch()

const hasSearch = computed(() => debouncedSearch.value.trim() !== '')

const { lastDayTasks, areTasksReady, hasTaskFetchError } = useXoTaskCollection()

const displayedTasks = computed(() => filterTasksByName(lastDayTasks.value, debouncedSearch.value))

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
}
</style>
