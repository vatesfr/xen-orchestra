<template>
  <VtsLayoutSidebar :side class="my-tasks-sidebar">
    <template #header>
      <div class="header">
        <span class="typo-body-bold">{{ t('tasks:my-tasks') }}</span>
      </div>
    </template>
    <template #subheader>
      <div class="search">
        <UiInput
          v-model="filter"
          :aria-label="t('tasks:search-in-my-tasks')"
          :placeholder="t('tasks:search-in-my-tasks')"
          right-icon="fa:magnifying-glass"
          accent="brand"
          clearable
        />
      </div>
    </template>
    <VtsQuickTaskList
      v-if="areTasksReady && displayedTasks.length > 0"
      :loading="!areTasksReady"
      :tasks="displayedTasks"
    />
    <VtsStateHero v-else-if="!areTasksReady" format="panel" type="busy" size="medium" />
    <VtsStateHero v-else-if="displayedTasks.length === 0" format="card" type="no-result" size="medium">
      {{ t('no-task') }}
    </VtsStateHero>
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { SidebarSide } from '@core/packages/sidebar'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsQuickTaskList from '@core/components/task/VtsQuickTaskList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { side = 'right' } = defineProps<{
  side?: SidebarSide
}>()

const { t } = useI18n()

const filter = ref('')

const { lastDayTasks, areTasksReady } = useXoTaskCollection()

const displayedTasks = computed(() => lastDayTasks.value)
</script>

<style lang="postcss" scoped>
.my-tasks-sidebar {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    height: 4rem;
    box-sizing: border-box;
  }

  .search {
    padding: 0.4rem;
  }

  :deep(.vts-quick-task-list) {
    max-height: none;
    padding: 0;
  }
}
</style>
