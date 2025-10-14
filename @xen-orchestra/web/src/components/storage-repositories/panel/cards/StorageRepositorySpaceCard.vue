<template>
  <UiCard>
    <UiCardTitle>
      {{ t('space') }}
    </UiCardTitle>
    <div class="content">
      <VtsProgressBar
        noruler
        :current="sr.physical_usage"
        :total="sr.size"
        :label="sr.name_label"
        legend-type="percent"
        class="progress"
      />
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('used-space') }}
        </template>
        <template #value>
          {{ usedSpace }}
        </template>
        <template #addons>
          <VtsCopyButton :value="usedSpace" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('free-space') }}
        </template>
        <template #value>
          {{ freeSpace }}
        </template>
        <template #addons>
          <VtsCopyButton :value="freeSpace" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('total-space') }}
        </template>
        <template #value>
          {{ totalSpace }}
        </template>
        <template #addons>
          <VtsCopyButton :value="totalSpace" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoSr } from '@/types/xo/sr.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSize } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XoSr
}>()

const { t } = useI18n()

const usedSpace = computed(() => formatSize(sr.physical_usage, 2))

const totalSpace = computed(() => formatSize(sr.size, 2))

const freeSpace = computed(() => formatSize(sr.size - sr.physical_usage, 2))
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .progress {
    margin-block-end: 1.6rem;
  }
}
</style>
