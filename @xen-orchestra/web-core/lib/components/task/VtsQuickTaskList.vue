<template>
  <DynamicScroller
    v-if="!loading && tasks.length > 0"
    :items="tasks"
    :min-item-size="83"
    class="vts-quick-task-list"
    list-tag="ul"
    item-tag="li"
  >
    <template #default="{ item: task, active }">
      <DynamicScrollerItem :item="task" :active :size-dependencies="[task.subtasks]">
        <UiQuickTaskItem :task />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
  <ul v-else class="vts-quick-task-list">
    <li v-if="loading">
      <div class="loading">
        <UiLoader />
        <div>{{ t('loading') }}</div>
      </div>
    </li>
    <li v-else-if="tasks.length === 0" class="typo-body-bold">{{ t('no-task') }}</li>
  </ul>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiQuickTaskItem, { type Task } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'
import { useI18n } from 'vue-i18n'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'

defineProps<{
  tasks: Task[]
  sublist?: boolean
  loading?: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-quick-task-list {
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-background-primary);
  padding: 1rem 0;

  &:not(.sublist) {
    padding: 1.6rem 2rem;
    max-height: 40rem;
    overflow: auto;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
}
</style>
