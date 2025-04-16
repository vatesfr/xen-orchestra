<template>
  <VtsDataTable :is-ready :has-error :no-data-message="tasks.length === 9 ? $t('no-task-detected') : undefined">
    <template #tbody>
      <template v-if="!isReady">
        <VtsTreeLoadingItem v-for="i in 5" :key="i" :icon="faTasks" />
      </template>

      <NoResults v-else-if="tasks.length === 0" />

      <template v-else>
        <VtsTreeList>
          <TaskTreeItem v-for="task in tasks" :key="task.id" :branch="task" />
        </VtsTreeList>
      </template>
    </template>
  </VtsDataTable>
  <UiTopBottomTable :selected-items="0" :total-items="tasks.length" />
</template>

<script setup lang="ts">
import NoResults from '@/components/NoResults.vue'
import TaskTreeItem from '@/components/tree/TaskTreeItem.vue'
import { useTaskTree } from '@/composables/task-tree.composable.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { faTasks } from '@fortawesome/free-solid-svg-icons'

const { tasks, isReady, hasError } = useTaskTree()
</script>

<style lang="postcss" scoped>
:deep(tbody) tr {
  border-bottom: 0 !important;
}
</style>
