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
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoPoolTasksCollection } from '@/modules/pool/remote-resources/use-xo-pool-tasks-collection.ts'
import TaskSidePanel from '@/modules/task/components/list/panel/TaskSidePanel.vue'
import TasksList from '@/modules/task/components/list/TasksList.vue'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const uiStore = useUiStore()

const { getTaskById, sortedTasks, hasTaskFetchError, areTasksReady } = useXoPoolTasksCollection({}, () => pool.id)
const { getUserById } = useXoUserCollection()

const { t } = useI18n()

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
