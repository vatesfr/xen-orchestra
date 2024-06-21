<template>
  <div class="usage-bar">
    <div
      v-for="item in computedData.sortedArray"
      :key="item.id"
      :class="{
        warning: item.value > MIN_WARNING_VALUE,
        error: item.value > MIN_DANGEROUS_VALUE,
      }"
      class="progress-item"
    >
      <UiProgressBar :value="item.value" color="custom" />
      <UiProgressLegend :label="item.label" :value="item.badgeLabel ?? $n(item.value / 100, 'percent')" />
    </div>
    <slot :total-percent="computedData.totalPercentUsage" name="footer" />
  </div>
</template>

<script lang="ts" setup>
import UiProgressBar from '@/components/ui/progress/UiProgressBar.vue'
import UiProgressLegend from '@/components/ui/progress/UiProgressLegend.vue'
import type { StatData } from '@/types/stat'
import { computed } from 'vue'

interface Props {
  data: StatData[]
  nItems?: number
}

const props = defineProps<Props>()

const MIN_WARNING_VALUE = 80
const MIN_DANGEROUS_VALUE = 90

const computedData = computed(() => {
  const _data = props.data
  let totalPercentUsage = 0
  return {
    sortedArray: _data
      ?.map(item => {
        const value = Math.round((item.value / (item.maxValue ?? 100)) * 100)
        totalPercentUsage += value
        return {
          ...item,
          value,
        }
      })
      .sort((item, nextItem) => nextItem.value - item.value)
      .slice(0, props.nItems ?? _data.length),
    totalPercentUsage,
  }
})
</script>

<style lang="postcss" scoped>
.usage-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item:nth-child(1) {
  --progress-bar-color: var(--color-purple-d60);
}

.progress-item:nth-child(2) {
  --progress-bar-color: var(--color-purple-d40);
}

.progress-item:nth-child(3) {
  --progress-bar-color: var(--color-purple-d20);
}

.progress-item {
  --progress-bar-height: 1.2rem;
  --progress-bar-color: var(--color-purple-l20);
  --progress-bar-background-color: var(--color-grey-500);

  &.warning {
    --progress-bar-color: var(--color-orange-base);
  }

  &.error {
    --progress-bar-color: var(--color-red-base);
  }
}
</style>
