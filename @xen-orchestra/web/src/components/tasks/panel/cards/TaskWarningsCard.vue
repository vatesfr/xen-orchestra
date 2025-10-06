<template>
  <UiCard>
    <UiCardTitle>
      {{ t('task.warnings') }}
      <UiCounter
        v-if="task.warnings"
        :value="Object.keys(task.warnings).length"
        accent="warning"
        size="small"
        variant="primary"
      />
    </UiCardTitle>
    <div class="content">
      <template v-for="(warning, index) in task.warnings" :key="index">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('task.message') }}</template>
          <template #value>{{ warning.message }}</template>
          <template v-if="warning.message" #addons>
            <VtsCopyButton :value="warning.message" />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoTask } from '@/types/xo/task.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  task: XoTask
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .divider {
    margin-block: 1.6rem;
  }
}
</style>
