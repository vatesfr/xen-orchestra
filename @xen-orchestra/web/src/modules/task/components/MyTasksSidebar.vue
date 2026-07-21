<template>
  <VtsLayoutSidebar :side class="my-tasks-sidebar">
    <template #header>
      <div class="header">
        <span class="typo-body-bold">{{ t('tasks:my-tasks') }}</span>
      </div>
    </template>

    <template #subheader>
      <SidebarSearch v-model="filter" :placeholder="t('tasks:search-in-my-tasks')" />
    </template>

    <VtsTaskList
      v-if="areTasksReady && displayedTasks.length > 0"
      :tasks="displayedTasks"
      :selected-task-id="selectedTaskId"
      @select="selectTask"
    />
    <VtsStateHero v-else-if="!areTasksReady" format="panel" type="busy" size="medium" />
    <VtsStateHero v-else-if="displayedTasks.length === 0" format="card" type="no-result" size="medium">
      {{ t('no-task') }}
    </VtsStateHero>
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import type { SidebarSide } from '@core/packages/sidebar'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { side = 'right' } = defineProps<{
  side?: SidebarSide
}>()

const { t } = useI18n()

const router = useRouter()

const filter = ref('')
const selectedTaskId = useRouteQuery('id')

const { lastDayTasks, areTasksReady } = useXoTaskCollection()

const displayedTasks = computed(() => lastDayTasks.value)

const selectTask = (id: string) => {
  router.push({ name: '/(site)/tasks', query: { id } })
}
</script>

<style lang="postcss" scoped>
.my-tasks-sidebar {
  background-color: var(--color-neutral-background-primary);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    height: 4rem;
    box-sizing: border-box;
  }
}
</style>
