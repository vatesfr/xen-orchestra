<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('space') }}
    </UiCardTitle>
    <div class="content">
      <VtsProgressBar
        noruler
        :current="vdi.usage"
        :total="vdi.size"
        :label="vdi.name_label"
        legend-type="percent"
        class="progress"
      />
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('used-space') }}
        </template>
        <template #value>
          {{ usedSpace.formattedValue }}
        </template>
        <template v-if="usedSpace.rawValue > 0" #addons>
          <VtsCopyButton :value="usedSpace.formattedValue" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('free-space') }}
        </template>
        <template #value>
          {{ freeSpace.formattedValue }}
        </template>
        <template v-if="freeSpace.rawValue > 0" #addons>
          <VtsCopyButton :value="freeSpace.formattedValue" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('size') }}
        </template>
        <template #value>
          {{ formattedSize }}
        </template>
        <template v-if="vdi.size > 0" #addons>
          <VtsCopyButton :value="formattedSize" />
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
import { formatSize } from '@core/utils/size.util.ts'
import type { XoVdi } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: XoVdi
}>()

const { t } = useI18n()

const usedSpace = computed(() => ({
  formattedValue: formatSize(vdi.usage, 2),
  rawValue: vdi.usage,
}))

const freeSpace = computed(() => {
  const rawFreeSpace = vdi.size - vdi.usage

  return {
    formattedValue: formatSize(rawFreeSpace, 2),
    rawValue: rawFreeSpace,
  }
})

const formattedSize = computed(() => formatSize(vdi.size, 2))
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
