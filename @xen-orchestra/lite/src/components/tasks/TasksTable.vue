<template>
  <UiTable :color="hasError ? 'error' : undefined" class="tasks-table">
    <thead>
      <tr>
        <th>{{ t('name') }}</th>
        <th>{{ t('object') }}</th>
        <th>{{ t('task.progress') }}</th>
        <th>{{ t('task.started') }}</th>
        <th>{{ t('task.estimated-end') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="hasError">
        <td colspan="5">
          <span class="text-error typo-h6">{{ t('error-no-data') }}</span>
        </td>
      </tr>
      <tr v-else-if="isFetching">
        <td colspan="5">
          <UiSpinner class="loader" />
        </td>
      </tr>
      <tr v-else-if="!hasTasks">
        <td class="no-tasks" colspan="5">{{ t('no-tasks') }}</td>
      </tr>
      <template v-else>
        <TaskRow v-for="task in pendingTasks" :key="task.uuid" :task is-pending />
        <TaskRow v-for="task in finishedTasks" :key="task.uuid" :task />
      </template>
    </tbody>
  </UiTable>
</template>

<script lang="ts" setup>
import TaskRow from '@/components/tasks/TaskRow.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiTable from '@/components/ui/UiTable.vue'
import type { XenApiTask } from '@/libs/xen-api/xen-api.types'
import { useTaskStore } from '@/stores/xen-api/task.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pendingTasks: XenApiTask[]
  finishedTasks?: XenApiTask[]
}>()

const { t } = useI18n()

const { hasError, isFetching } = useTaskStore().subscribe()

const hasTasks = computed(() => props.pendingTasks.length > 0 || (props.finishedTasks?.length ?? 0) > 0)
</script>

<style lang="postcss" scoped>
.tasks-table {
  width: 100%;
}

.no-tasks {
  text-align: center;
  color: var(--color-neutral-txt-secondary);
  font-style: italic;
}

td[colspan='5'] {
  text-align: center;
}

.text-error {
  color: var(--color-danger-txt-base);
}

.loader {
  color: var(--color-brand-txt-base);
  display: block;
  font-size: 4rem;
  margin: 2rem auto 0;
}
</style>
