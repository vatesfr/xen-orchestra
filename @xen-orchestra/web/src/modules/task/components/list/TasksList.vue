<template>
  <div class="tasks-list">
    <UiTitle>
      {{ title ?? t('tasks') }}
      <template v-if="autoCollapseToggle" #action>
        <UiToggle v-model="autoCollapseCompleted" class="auto-collapse-toggle">
          {{ t('auto-collapse-completed-tasks') }}
        </UiToggle>
      </template>
    </UiTitle>
    <UiQuerySearchBar v-bind="searchBindings" />
    <div class="container">
      <div class="actions">
        <UiTableControlsBar :pagination-bindings />
      </div>
      <VtsStateHero v-if="busy" format="card" type="busy" size="medium" />
      <VtsStateHero v-else-if="hasError" format="table" type="error" size="small" no-background>
        {{ t('error-no-data') }}
      </VtsStateHero>
      <VtsStateHero v-else-if="tasks.length === 0" format="table" type="no-data" size="small">
        {{ t('no-task-detected') }}
      </VtsStateHero>
      <VtsTaskList
        v-else
        class="tasks"
        :tasks="tasksRecords"
        :selected-task-id="selectedTaskId"
        :auto-collapse-completed
        @select="id => (selectedTaskId = id)"
      />
      <VtsStateHero v-if="hasNoSearchResult" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTableControlsBar :pagination-bindings />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableControlsBar from '@core/components/ui/table-controls-bar/UiTableControlsBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useSearchFilter } from '@core/composables/search-filter.composable.ts'
import { hasSubtask } from '@core/utils/task.util.ts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { tasks, title } = defineProps<{
  tasks: Task[]
  hasError: boolean
  busy: boolean
  title?: string
  autoCollapseToggle?: boolean
}>()

const { t } = useI18n()

const selectedTaskId = useRouteQuery('id')

const autoCollapseCompleted = ref(false)

const { items: filteredTasks, hasSearch, searchBindings } = useSearchFilter(() => tasks)

const hasNoSearchResult = computed(() => hasSearch.value && filteredTasks.value.length === 0)

const { pageRecords: tasksRecords, paginationBindings, seek } = usePagination('tasks', filteredTasks)

watch(
  [
    selectedTaskId,
    () => {
      const taskId = selectedTaskId.value

      return taskId ? filteredTasks.value.find(task => task.id === taskId || hasSubtask(task, taskId))?.id : undefined
    },
  ],
  ([, rootTaskId]) => {
    if (rootTaskId !== undefined) {
      seek(task => task.id === rootTaskId)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="postcss">
.tasks-list,
.actions,
.container {
  display: flex;
  flex-direction: column;
}

.tasks-list {
  gap: 2.4rem;

  .container,
  .actions {
    gap: 0.8rem;
  }

  .auto-collapse-toggle {
    text-transform: none;
  }

  .tasks {
    overflow-x: auto;
    overflow-y: hidden;
    padding-inline: 0.4rem 0.8rem;
  }
}
</style>
