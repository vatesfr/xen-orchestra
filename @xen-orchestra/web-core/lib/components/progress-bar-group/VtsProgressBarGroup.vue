<template>
  <div class="vts-progress-bar-group">
    <UiDataRuler :max="highestPercentageCap" :warning="threshold.payload" />
    <UiProgressBar
      v-for="item of progressItems"
      :key="item.source.id"
      :accent="item.threshold.payload?.accent ?? 'info'"
      :fill-width="item.fillWidth"
      :legend="toLegend(item.source.label, item)"
    />
  </div>
</template>

<script generic="TSource" lang="ts" setup>
import type {
  ProgressBarLegendType,
  ProgressBarThresholdConfig,
} from '@core/components/progress-bar/VtsProgressBar.vue'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { useProgressGroup } from '@core/packages/progress/use-progress-group.ts'
import { useThreshold } from '@core/packages/threshold/use-threshold.ts'
import { defaultProgressThresholds, useProgressToLegend } from '@core/utils/progress.util.ts'
import { computed } from 'vue'

export type ProgressBarGroupItem = { id: string; current: number; total: number; label: string }

const {
  items,
  thresholds = defaultProgressThresholds(),
  sort = 'desc',
  legendType,
  nItems,
} = defineProps<{
  items: ProgressBarGroupItem[]
  legendType?: ProgressBarLegendType
  thresholds?: ProgressBarThresholdConfig
  sort?: 'asc' | 'desc' | 'none'
  nItems?: number
}>()

const {
  highestPercentageCap,
  progressItems: rawProgressItems,
  highestPercentage,
} = useProgressGroup(() => items, {
  sort: () => (sort === 'none' ? undefined : sort),
})

const progressItems = computed(() => {
  const items = rawProgressItems.value.map(item => {
    return {
      ...item,
      threshold: useThreshold(item.percentage, thresholds).value,
    }
  })

  if (nItems) {
    return items.slice(0, nItems)
  }

  return items
})

const toLegend = useProgressToLegend(() => legendType)

const threshold = useThreshold(highestPercentage, () => thresholds)
</script>

<style lang="postcss" scoped>
.vts-progress-bar-group {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
