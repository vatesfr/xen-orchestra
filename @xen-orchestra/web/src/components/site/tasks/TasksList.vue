<template>
  <div class="tasks-list">
    <div class="container">
      <div class="actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsStateHero v-if="hasError" format="table" type="error" size="small" no-background>
        {{ t('error-no-data') }}
      </VtsStateHero>
      <VtsStateHero v-else-if="tasks.length === 0" format="table" type="no-data" size="small">
        {{ t('no-tasks-detected') }}
      </VtsStateHero>
      <UiTaskList v-else :tasks="tasksRecords" />
      <VtsStateHero v-if="searchQuery && filteredTasks.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@core/types/task.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { tasks } = defineProps<{
  tasks: Task[]
  hasError: boolean
}>()

const { t } = useI18n()

// const selectedTaskId = useRouteQuery('id')

const searchQuery = ref('')

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
}
</style>
