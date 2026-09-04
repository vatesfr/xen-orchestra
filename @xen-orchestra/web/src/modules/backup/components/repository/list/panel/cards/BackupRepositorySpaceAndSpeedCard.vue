<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('space-and-speed') }}</UiCardTitle>

    <div>
      <span class="typo-body-bold-small subtitle">{{ t('space') }}</span>
      <div class="content">
        <VtsCardRowKeyValue truncate align-top>
          <template #key>{{ t('used-space-on-br') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue truncate align-top>
          <template #key>{{ t('free-space-on-br') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue truncate align-top>
          <template #key>{{ t('allocated-space') }}</template>
          <template #value />
        </VtsCardRowKeyValue>
      </div>
    </div>

    <VtsDivider type="stretch" />

    <div>
      <div class="typo-body-bold-small subtitle">
        {{ t('speed') }}
        <UiButtonIcon
          v-tooltip="!canBenchmark && benchmarkErrorMessage"
          :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmark"
          accent="brand"
          size="small"
          @click="benchmark()"
        />
      </div>
      <div class="content">
        <VtsCardRowKeyValue truncate align-top>
          <template #key>{{ t('writing-speed') }}</template>
          <template #value>{{ writeSpeed }}</template>
          <template v-if="writeSpeed" #addons>
            <VtsCopyButton :value="writeSpeed" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue truncate align-top>
          <template #key>{{ t('reading-speed') }}</template>
          <template #value>{{ readSpeed }}</template>
          <template v-if="readSpeed" #addons>
            <VtsCopyButton :value="readSpeed" />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const lastBenchmark = computed(() => br.benchmarks?.at(-1))

const formatSpeed = (bytesPerSecond: number) => {
  const { value, prefix } = formatSpeedRaw(bytesPerSecond, 2)

  return `${value} ${prefix}`
}

const readSpeed = computed(() =>
  lastBenchmark.value === undefined ? undefined : formatSpeed(lastBenchmark.value.readRate)
)

const writeSpeed = computed(() =>
  lastBenchmark.value === undefined ? undefined : formatSpeed(lastBenchmark.value.writeRate)
)

const {
  run: benchmark,
  canRun: canBenchmark,
  isRunning: isBenchmarking,
  errorMessage: benchmarkErrorMessage,
} = useXoBackupRepositoryBenchmarkJob(() => br)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .subtitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-neutral-txt-primary);
    margin-block-end: 1.6rem;
  }
}
</style>
