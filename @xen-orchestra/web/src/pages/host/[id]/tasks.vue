<template>
  <VtsContentSidePanel class="tasks">
    <UiCard class="container">
      <TasksList :tasks="convertedTasks" :has-error="hasTaskFetchError" :busy="!areTasksReady" />
    </UiCard>
    <TaskSidePanel :task="selectedTask" @close="selectedTask = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoHostTasksCollection } from '@/modules/host/remote-resources/use-xo-host-tasks-collection.ts'
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import { useXoTasksConversion } from '@/modules/task/composables/xo-tasks-conversion.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoHostTasksCollection({}, () => host.id)

const selectedTask = useRouteQuery<FrontXoTask | undefined>('id', {
  toData: id => getTaskById(id as FrontXoTask['id']),
  toQuery: task => task?.id ?? '',
})

const { convertedTasks } = useXoTasksConversion(sortedTasks)
</script>

<style scoped lang="postcss">
.tasks {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
