<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('errors')" :counter="{ value: 1, accent: 'danger' }" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('message') }}</template>
        <template #value>{{ task.result?.message }}</template>
        <template v-if="task.result?.message" #addons>
          <VtsCopyButton :value="String(task.result.message)" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
    <UiLogEntryViewer
      v-if="task.result?.stack"
      :content="task.result.stack"
      :label="t('api-error-details')"
      size="small"
      accent="danger"
    />
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  task: FrontXoTask
}>()

const { t } = useI18n()
</script>
