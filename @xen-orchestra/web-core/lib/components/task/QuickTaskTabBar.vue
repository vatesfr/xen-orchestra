<template>
  <VtsTabList :disabled="loading">
    <VtsTabItem v-bind="tabs.pending.bindings">
      {{ $t('tasks.quick-view.in-progress') }}
      <VtsCounter
        v-if="pendingCount !== undefined"
        :value="pendingCount"
        accent="brand"
        variant="primary"
        size="small"
      />
    </VtsTabItem>
    <VtsTabItem v-bind="tabs.success.bindings">
      {{ $t('tasks.quick-view.done') }}
      <VtsCounter
        v-if="successCount !== undefined"
        :value="successCount"
        accent="success"
        variant="primary"
        size="small"
      />
    </VtsTabItem>
    <VtsTabItem v-bind="tabs.failure.bindings">
      {{ $t('tasks.quick-view.failed') }}
      <VtsCounter
        v-if="failureCount !== undefined"
        :value="failureCount"
        accent="danger"
        variant="primary"
        size="small"
      />
    </VtsTabItem>
    <Divider type="tab" />
    <VtsTabItem v-bind="tabs.all.bindings">
      {{ $t('tasks.quick-view.all') }}
    </VtsTabItem>
    <!--
    TODO
    <UiButton :right-icon="faAngleRight" class="see-all" level="tertiary" size="extra-small">
      {{ $t('see-all') }}
    </UiButton>
    -->
  </VtsTabList>
</template>

<script lang="ts" setup>
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import Divider from '@core/components/divider/Divider.vue'
import { useTabList } from '@core/components/tab/tab-list.composable'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
import type { TaskTab } from '@core/types/task.type'

defineProps<{
  loading?: boolean
  pendingCount?: number
  successCount?: number
  failureCount?: number
}>()

const currentTab = defineModel<TaskTab>({ required: true })

const { tabs } = useTabList<TaskTab>(['pending', 'success', 'failure', 'all'], currentTab)
</script>
