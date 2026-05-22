<template>
  <div class="tasks" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <TasksList :tasks="convertedTasks" :has-error="hasTaskFetchError" :busy="!areTasksReady" />
    </UiCard>
    <TaskSidePanel :task="selectedTask" @close="selectedTask = undefined" />
  </div>
</template>

<script setup lang="ts">
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmTasksCollection } from '@/modules/vm/remote-resources/use-xo-vm-tasks-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const panelStore = usePanelStore()
const uiStore = useUiStore()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoVmTasksCollection({}, () => vm.id)
const { getUserById } = useXoUserCollection()

const selectedTask = useRouteQuery<FrontXoTask | undefined>('id', {
  toData: id => getTaskById(id as FrontXoTask['id']),
  toQuery: task => task?.id ?? '',
})

const convertedTasks = computed(() =>
  sortedTasks.value.map(task => {
    const userId = task.properties.userId

    if (!userId) {
      return convertXoTaskToCore(task)
    }

    const user = getUserById(userId as XoUser['id'])

    // TODO , just put username when it is available in endpoint
    return convertXoTaskToCore(task, user?.name ? user?.name : user?.email)
  })
)
</script>

<style scoped lang="postcss">
.tasks {
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
