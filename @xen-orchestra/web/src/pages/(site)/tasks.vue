<template>
  <div class="tasks" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <TasksList :tasks="convertedTasks" :has-error="hasTaskFetchError" :busy="!areTasksReady" />
    </UiCard>
    <TaskSidePanel v-if="selectedTask" :task="selectedTask" @close="selectedTask = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import { useXoTasksConversion } from '@/modules/task/composables/xo-tasks-conversion.composable.ts'
import { useXoTaskCollection, type FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoTaskCollection()

const { t } = useI18n()

const selectedTask = useRouteQuery<FrontXoTask | undefined>('id', {
  toData: id => getTaskById(id as FrontXoTask['id']),
  toQuery: task => task?.id ?? '',
})

const { convertedTasks } = useXoTasksConversion(sortedTasks)
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
