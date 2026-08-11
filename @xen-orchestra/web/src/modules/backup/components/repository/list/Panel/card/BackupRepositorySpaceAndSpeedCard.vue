<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('space-and-speed') }}</UiCardTitle>

    <div class="section">
      <span class="typo-body-bold-small subtitle">{{ t('space') }}</span>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>{{ t('used-space-on-br') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('free-space-on-br') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('allocated-space') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
      </div>
    </div>

    <VtsDivider type="stretch" />

    <div class="section">
      <span class="typo-body-bold-small subtitle">{{ t('speed') }}</span>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>{{ t('writing-speed') }}</template>
          <template #value>{{ writeSpeed }}</template>
          <template v-if="writeSpeed" #addons>
            <VtsCopyButton :value="writeSpeed" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('reading-speed') }}</template>
          <template #value>{{ readSpeed }}</template>
          <template v-if="writeSpeed" #addons>
            <VtsCopyButton :value="writeSpeed" />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const lastBenchmark = computed(() => br.benchmarks?.at(-1))

const formatSpeed = (bytesPerSecond: number) => {
  const { value, prefix } = formatSpeedRaw(bytesPerSecond)

  return `${value} ${prefix}`
}

const readSpeed = computed(() =>
  lastBenchmark.value === undefined ? undefined : formatSpeed(lastBenchmark.value.readRate)
)

const writeSpeed = computed(() =>
  lastBenchmark.value === undefined ? undefined : formatSpeed(lastBenchmark.value.writeRate)
)
</script>
