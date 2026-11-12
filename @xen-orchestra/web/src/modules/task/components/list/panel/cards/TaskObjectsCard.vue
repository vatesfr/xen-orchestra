<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('object')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('id') }}</template>
        <template #value>{{ task.properties.objectId }}</template>
        <template #addons>
          <VtsCopyButton :value="String(task.properties.objectId)" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  task: FrontXoTask
}>()

const { t } = useI18n()
</script>
