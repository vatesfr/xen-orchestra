<template>
  <div class="tasks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VtsStateHero v-if="areTasksFetching" busy format="card" size="medium" />
      <TasksList v-else :tasks="convertedTasks" :has-error="hasTaskFetchError" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import TasksList from '@/components/site/tasks/TasksList.vue'
import { useXoTaskCollection } from '@/remote-resources/use-xo-task-collection.ts'
import { useXoUserCollection } from '@/remote-resources/use-xo-user-collections.ts'
import { convertTaskToCore } from '@/utils/convert-task-to-core.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'

const uiStore = useUiStore()

const { tasks, hasTaskFetchError, areTasksFetching } = useXoTaskCollection()
const { getUserById } = useXoUserCollection()

const convertedTasks = computed(() =>
  tasks.value.map(task => {
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
    grid-template-columns: minmax(0, 1fr);
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
