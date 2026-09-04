<template>
  <UiPanelCard class="card-container">
    <UiCardTitle>{{ t('space-and-speed') }}</UiCardTitle>

    <div class="content">
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

    <div class="content">
      <div class="typo-body-bold-small subtitle">
        {{ t('speed') }}
        <UiButtonIcon
          v-tooltip="canBenchmark ? t('click-test-BR-speed') : benchmarkErrorMessage"
          :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
          :disabled="!canBenchmark"
          accent="brand"
          size="small"
          @click="runBenchmark()"
        />
      </div>
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
        <template v-if="readSpeed" #addons>
          <VtsCopyButton :value="readSpeed" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const storedBenchmark = computed(() => br.benchmarks?.at(-1))

const manualBenchmark = ref<{ readRate: number; writeRate: number } | undefined>()

const displayedBenchmark = computed(() => manualBenchmark.value ?? storedBenchmark.value)

const formatSpeed = (bytesPerSecond: number) => {
  const { value, prefix } = formatSpeedRaw(bytesPerSecond, { maxDecimals: 2 })

  return `${value} ${prefix}`
}

const readSpeed = computed(() =>
  displayedBenchmark.value === undefined ? undefined : formatSpeed(displayedBenchmark.value.readRate)
)

const writeSpeed = computed(() =>
  displayedBenchmark.value === undefined ? undefined : formatSpeed(displayedBenchmark.value.writeRate)
)

const {
  run: benchmark,
  canRun: canBenchmark,
  isRunning: isBenchmarking,
  errorMessage: benchmarkErrorMessage,
} = useXoBackupRepositoryBenchmarkJob(() => br)

const runBenchmark = async () => {
  const result = await benchmark()

  manualBenchmark.value = {
    readRate: result.readRate,
    writeRate: result.writeRate,
  }
}

watch(
  () => br.id,
  () => {
    manualBenchmark.value = undefined
  }
)
</script>

<style scoped lang="postcss">
.card-container {
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
  }
}
</style>
