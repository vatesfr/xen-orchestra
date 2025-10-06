<template>
  <div class="tasks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VtsStateHero v-if="areTasksFetching" busy format="card" size="medium" />
      <TasksList v-else :tasks="convertedTasks" :has-error="hasTaskFetchError" />
    </UiCard>
    <TaskSidePanel v-if="selectedTask" :task="selectedTask" @close="selectedTask = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import TaskSidePanel from '@/components/tasks/panel/TaskSidePanel.vue'
import TasksList from '@/components/tasks/TasksList.vue'
import { useXoTaskCollection } from '@/remote-resources/use-xo-task-collection.ts'
import { useXoUserCollection } from '@/remote-resources/use-xo-user.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import { convertTaskToCore } from '@/utils/convert-task-to-core.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { tasks, getTaskById, hasTaskFetchError, areTasksFetching } = useXoTaskCollection()
const { useGetUserById } = useXoUserCollection()

const { t } = useI18n()

const selectedTask = useRouteQuery<XoTask | undefined>('id', {
  toData: id => getTaskById(id as XoTask['id']),
  toQuery: task => task?.id ?? '',
})

const convertedTasks = computed(() =>
  tasks.value.map(task => {
    const userId = task.properties.userId

    if (!userId) {
      return convertTaskToCore(task)
    }

    const user = useGetUserById(() => userId)

    return convertTaskToCore(task, user.value?.name)
  })
)
</script>

<style scoped lang="postcss">
.tasks {
  &:not(.mobile) {
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
