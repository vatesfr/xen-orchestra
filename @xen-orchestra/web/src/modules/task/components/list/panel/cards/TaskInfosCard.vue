<template>
  <UiPanelCard class="task-infos-card">
    <UiPanelCardTitle
      size="medium"
      :label="t('info')"
      :counter="{ value: Object.keys(task.infos!).length, accent: 'info' }"
    />
    <div class="content">
      <template v-for="(info, index) in task.infos" :key="index">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('message') }}</template>
          <template #value>{{ info.message }}</template>
          <template v-if="info.message" #addons>
            <VtsCopyButton :value="info.message" />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  task: FrontXoTask
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.task-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .divider {
      margin-block: 1.6rem;
    }
  }
}
</style>
