<template>
  <div class="tasks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <TasksList :tasks="convertedTasks" :has-error="hasTaskFetchError" :busy="!areTasksReady" />
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
import { useXoHostTasksCollection } from '@/modules/host/remote-resources/use-xo-host-tasks-collection.ts'
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import { convertTaskToCore } from '@/modules/task/utils/convert-task-to-core.util'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import type { XoHost, XoTask, XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const uiStore = useUiStore()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoHostTasksCollection({}, () => host.id)
const { getUserById } = useXoUserCollection()

const { t } = useI18n()

const selectedTask = useRouteQuery<XoTask | undefined>('id', {
  toData: id => getTaskById(id as XoTask['id']),
  toQuery: task => task?.id ?? '',
})

const convertedTasks = computed(() =>
  sortedTasks.value.map(task => {
    const userId = task.properties.userId

    if (!userId) {
      return convertTaskToCore(task)
    }

    const user = getUserById(userId as XoUser['id'])

    // TODO , just put username when it is available in endpoint
    return convertTaskToCore(task, user?.name ? user?.name : user?.email)
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
