<template>
  <div class="backup-log-run-tasks-list">
    <UiTitle>
      {{ t('run') }}
    </UiTitle>
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <div class="container">
      <div class="actions">
        <UiTableControlsBar :pagination-bindings />
      </div>
      <VtsStateHero v-if="convertedTasks.length === 0" format="table" type="no-data" size="small">
        {{ t('no-task-detected') }}
      </VtsStateHero>
      <UiTaskList
        v-else
        :tasks="tasksRecords"
        :selected-task-id="selectedTaskId"
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
import { useXoBackupLogTasksConversion } from '@/modules/backup-log/composables/use-xo-backup-log-tasks-conversion.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableControlsBar from '@core/components/ui/table-controls-bar/UiTableControlsBar.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

const { convertedTasks } = useXoBackupLogTasksConversion(() => backupLog)

const selectedTaskId = useRouteQuery('id')

const searchQuery = ref('')

const filteredTasks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return convertedTasks.value
  }

  return convertedTasks.value.filter(task =>
    Object.values(task).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { pageRecords: tasksRecords, paginationBindings } = usePagination('backup-log-tasks', filteredTasks)
</script>

<style scoped lang="postcss">
.backup-log-run-tasks-list,
.actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-log-run-tasks-list {
  gap: 2.4rem;

  .container,
  .actions {
    gap: 0.8rem;
  }
}
</style>
