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
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
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
      <UiTaskList
        v-else
        :tasks="tasksRecords"
        :selected-task-id="selectedTaskId"
        :auto-collapse-completed
        @select="id => (selectedTaskId = id)"
      />
      <VtsStateHero v-if="searchQuery && filteredTasks.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTableControlsBar :pagination-bindings />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableControlsBar from '@core/components/ui/table-controls-bar/UiTableControlsBar.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed, ref } from 'vue'
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

const searchQuery = ref('')

const autoCollapseCompleted = ref(false)

const filteredTasks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return tasks
  }

  return tasks.filter(task => Object.values(task).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const { pageRecords: tasksRecords, paginationBindings } = usePagination('tasks', filteredTasks)
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
}
</style>
