<template>
  <div class="top-bottom">
    <div class="typo-body-regular-small label">
      {{ tasks.length }} {{ $t('of') }} {{ tasks.length }} {{ $t('tasks', tasks.length) }}
    </div>
    <UiButton variant="tertiary" accent="brand" size="medium">{{ $t('refresh') }}</UiButton>
  </div>
  <VtsDataTable
    class="task-table"
    :is-ready
    :has-error
    :no-data-message="tasks.length === 9 ? $t('no-task-detected') : undefined"
  >
    <template #tbody>
      <template v-if="!isReady">
        <VtsTreeLoadingItem v-for="i in 5" :key="i" :icon="faTasks" />
      </template>

      <NoResults v-else-if="tasks.length === 0" />

      <template v-else>
        <VtsTreeList>
          <TaskTreeItem
            v-for="(task, index) in tasks"
            :key="task.id"
            :branch="task"
            :class="{
              'is-first': index === 0,
              'is-last': index === tasks.length - 1,
            }"
          />
        </VtsTreeList>
      </template>
    </template>
  </VtsDataTable>
  <div class="top-bottom">
    <div class="typo-body-regular-small label">
      {{ tasks.length }} {{ $t('of') }} {{ tasks.length }} {{ $t('tasks', tasks.length) }}
    </div>
    <UiButton variant="tertiary" accent="brand" size="medium">{{ $t('refresh') }}</UiButton>
  </div>
</template>

<script setup lang="ts">
import NoResults from '@/components/NoResults.vue'
import TaskTreeItem from '@/components/tree/TaskTreeItem.vue'
import { useTaskTree } from '@/composables/task-tree.composable.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faTasks } from '@fortawesome/free-solid-svg-icons'

const { tasks, isReady, hasError } = useTaskTree()
</script>

<style lang="postcss" scoped>
.task-table {
  .is-first {
    border-top: 0.1rem solid var(--color-neutral-border);
  }

  .is-last {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  :deep(tbody) tr {
    border-bottom: 0 !important;
  }
}

.top-bottom {
  display: flex;
  gap: 0.8rem;

  .label {
    color: var(--color-neutral-txt-secondary);
    align-content: center;
  }
}
</style>
