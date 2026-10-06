<template>
  <TabList :disabled="loading">
    <UiTabItem v-bind="tabs.pending.bindings">
      {{ t('in-progress') }}
      <UiCounter
        v-if="pendingCount !== undefined"
        :value="pendingCount"
        accent="warning"
        variant="primary"
        size="small"
      />
    </UiTabItem>
    <UiTabItem v-bind="tabs.success.bindings">
      {{ t('done') }}
      <UiCounter
        v-if="successCount !== undefined"
        :value="successCount"
        accent="success"
        variant="primary"
        size="small"
      />
    </UiTabItem>
    <UiTabItem v-bind="tabs.failure.bindings">
      {{ t('failed') }}
      <UiCounter
        v-if="failureCount !== undefined"
        :value="failureCount"
        accent="danger"
        variant="primary"
        size="small"
      />
    </UiTabItem>
    <VtsDivider type="tab" />
    <UiTabItem v-bind="tabs.all.bindings">
      {{ t('all') }}
    </UiTabItem>
    <!--
    TODO
    <UiButton :right-icon="faAngleRight" class="see-all" level="tertiary" size="extra-small">
      {{ t('action:see-all') }}
    </UiButton>
    -->
  </TabList>
</template>

<script lang="ts" setup>
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useTabList } from '@core/composables/tab-list.composable.ts'
import type { TaskStatus } from '@core/types/task.type.ts'
import { useI18n } from 'vue-i18n'

export type TaskTab = TaskStatus | 'all'

defineProps<{
  loading?: boolean
  pendingCount?: number
  successCount?: number
  failureCount?: number
}>()

const currentTab = defineModel<TaskTab>({ required: true })

const { t } = useI18n()

const { tabs } = useTabList<TaskTab>(['pending', 'success', 'failure', 'all'], currentTab)
</script>
