<template>
  <div class="vts-progress-bar">
    <UiDataRuler :max="percentageCap" :warning="threshold.payload" />
    <UiProgressBar :accent="threshold.payload.accent ?? 'info'" :fill-width :legend />
  </div>
</template>

<script generic="TSource" lang="ts" setup>
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import UiProgressBar, { type ProgressBarAccent } from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { useProgress } from '@core/packages/progress/use-progress.ts'
import type { ThresholdConfig } from '@core/packages/threshold/type.ts'
import { useThreshold } from '@core/packages/threshold/use-threshold.ts'
import { defaultProgressThresholds, useProgressToLegend } from '@core/utils/progress.util.ts'

export type ProgressBarLegendType = 'percent' | 'bytes' | 'bytes-with-total' | 'value' | 'value-with-total'

export type ProgressBarThresholdPayload = { accent?: ProgressBarAccent; tooltip?: string }

export type ProgressBarThresholdConfig = ThresholdConfig<ProgressBarThresholdPayload>

const {
  current,
  total,
  label,
  thresholds = defaultProgressThresholds(),
  legendType,
} = defineProps<{
  current: number
  total: number
  label: string
  legendType?: ProgressBarLegendType
  thresholds?: ProgressBarThresholdConfig
}>()

const progress = useProgress(
  () => current,
  () => total
)

const { percentageCap, percentage, fillWidth } = progress

const legend = useProgressToLegend(() => legendType, label, progress)

const threshold = useThreshold(percentage, () => thresholds)
</script>

<style lang="postcss" scoped>
.vts-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
