<template>
  <VtsContentSidePanel class="tasks">
    <UiCard class="container">
      <TasksList :tasks="convertedTasks" :has-error="hasTaskFetchError" :busy="!areTasksReady" />
    </UiCard>
    <TaskSidePanel :task="selectedTask" @close="selectedTask = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import { useXoTasksConversion } from '@/modules/task/composables/xo-tasks-conversion.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmTasksCollection } from '@/modules/vm/remote-resources/use-xo-vm-tasks-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
<<<<<<< HEAD
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
||||||| parent of 3656ecac8 (feat(xo6): resolve objects in tasks names)
import { useUiStore } from '@core/stores/ui.store'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
=======
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'
>>>>>>> 3656ecac8 (feat(xo6): resolve objects in tasks names)

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoVmTasksCollection({}, () => vm.id)

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
