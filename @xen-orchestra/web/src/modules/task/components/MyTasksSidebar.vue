<template>
  <VtsLayoutSidebar side="right" class="my-tasks-sidebar">
    <template #header>
      <div class="header">
        <span class="typo-body-bold">{{ t('tasks:my-tasks') }}</span>
        <UiLink size="small" :to="{ name: '/(site)/tasks' }">{{ t('tasks:see-all') }}</UiLink>
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

    <VtsStateHero v-if="!areTasksReady || isSearching" format="panel" type="busy" size="medium" />
    <VtsTaskList
      v-else-if="displayedTasks.length > 0"
      class="tasks"
      :tasks="displayedTasks"
      :selected-task-id="selectedTaskId"
      :expand-all="hasFilter"
      @select="id => selectTask(id)"
    />
    <VtsStateHero v-else format="card" type="no-result" size="medium">
      {{ hasFilter ? t('no-result') : t('no-task') }}
    </VtsStateHero>
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import { useXoTaskCollection, type FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useDebouncedRef } from '@core/composables/debounced-ref.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { filterTasksByName } from '@core/utils/task.util.ts'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
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

const routeTaskId = useRouteQuery('id')

const selectedTaskId = computed(() => (route.name === '/(site)/tasks' ? routeTaskId.value : undefined))

const { lastDayTasks, areTasksReady } = useXoTaskCollection()

const displayedTasks = computed(() => filterTasksByName(lastDayTasks.value, debouncedFilter.value))

const selectTask = (id: string) => {
  router.push(getTaskRoute(id as FrontXoTask['id']))
}
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
