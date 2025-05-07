<template>
  <TabList :disabled="loading">
    <TabItem v-bind="tabs.pending.bindings">
      {{ $t('tasks.quick-view.in-progress') }}
      <UiCounter
        v-if="pendingCount !== undefined"
        :value="pendingCount"
        accent="warning"
        variant="primary"
        size="small"
      />
    </TabItem>
    <TabItem v-bind="tabs.success.bindings">
      {{ $t('tasks.quick-view.done') }}
      <UiCounter
        v-if="successCount !== undefined"
        :value="successCount"
        accent="success"
        variant="primary"
        size="small"
      />
    </TabItem>
    <TabItem v-bind="tabs.failure.bindings">
      {{ $t('tasks.quick-view.failed') }}
      <UiCounter
        v-if="failureCount !== undefined"
        :value="failureCount"
        accent="danger"
        variant="primary"
        size="small"
      />
    </TabItem>
    <VtsDivider type="tab" />
    <TabItem v-bind="tabs.all.bindings">
      {{ $t('tasks.quick-view.all') }}
    </TabItem>
    <!--
    TODO
    <UiButton :right-icon="faAngleRight" class="see-all" level="tertiary" size="extra-small">
      {{ $t('see-all') }}
    </UiButton>
    -->
  </TabList>
</template>

<script lang="ts" setup>
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import type { TaskStatus } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'
import { useTabList } from '@core/composables/tab-list.composable'

export type TaskTab = TaskStatus | 'all'

defineProps<{
  loading?: boolean
  pendingCount?: number
  successCount?: number
  failureCount?: number
}>()

const currentTab = defineModel<TaskTab>({ required: true })

const { tabs } = useTabList<TaskTab>(['pending', 'success', 'failure', 'all'], currentTab)
</script>
