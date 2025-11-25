<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('space') }}
    </UiCardTitle>

    <div class="content">
      <VtsProgressBar noruler :current="used" :total :label legend-type="percent" class="progress" />

      <VtsCardRowKeyValue>
        <template #key>{{ t('used-space') }}</template>
        <template #value>{{ usedSpace.formattedValue }}</template>
        <template v-if="usedSpace.rawValue > 0" #addons>
          <VtsCopyButton :value="usedSpace.formattedValue" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('free-space') }}</template>
        <template #value>
          {{ freeSpace.formattedValue }}
        </template>
        <template v-if="freeSpace.rawValue > 0" #addons>
          <VtsCopyButton :value="freeSpace.formattedValue" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ totalSizeLabel ? totalSizeLabel : t('size') }}</template>
        <template #value>
          {{ totalSpace.formattedValue }}
        </template>
        <template v-if="totalSpace.rawValue > 0" #addons>
          <VtsCopyButton :value="totalSpace.formattedValue" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSize } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { used, total } = defineProps<{
  used: number
  total: number
  label: string
  totalSizeLabel?: string
}>()

const { t } = useI18n()

const usedSpace = computed(() => ({
  formattedValue: formatSize(used, 2),
  rawValue: used,
}))

const totalSpace = computed(() => ({
  formattedValue: formatSize(total, 2),
  rawValue: total,
}))

const freeSpace = computed(() => {
  const rawFreeSpace = total - used

  return {
    formattedValue: formatSize(rawFreeSpace, 2),
    rawValue: rawFreeSpace,
  }
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .progress {
      margin-block-end: 1.6rem;
    }
  }
}
</style>
