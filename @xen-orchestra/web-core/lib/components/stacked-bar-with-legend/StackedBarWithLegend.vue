<template>
  <div class="stacked-bar-with-legend">
    <StackedBar :segments :max-value="maxValue" />
    <LegendList class="list" :horizontal="uiStore.isDesktop">
      <LegendItem
        v-for="segment in segments"
        :key="segment.label"
        :color="segment.color"
        :tooltip="segment.tooltip"
        :unit="segment.unit"
        :value="segment.value"
      >
        {{ segment.label }}
      </LegendItem>
    </LegendList>
  </div>
</template>

<script setup lang="ts">
import LegendItem, { type LegendItemProps } from '@core/components/legend/LegendItem.vue'
import LegendList from '@core/components/legend/LegendList.vue'
import StackedBar, { type StackedBarProps } from '@core/components/stacked-bar/StackedBar.vue'
import { useUiStore } from '@core/stores/ui.store'

type Segment = StackedBarProps['segments'][number] & LegendItemProps & { label: string }

export type StackedBarWithLegendProps = {
  segments: Segment[]
  maxValue?: StackedBarProps['maxValue']
}

defineProps<StackedBarWithLegendProps>()

const uiStore = useUiStore()
</script>

<style scoped lang="scss">
.stacked-bar-with-legend {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.list {
  margin-inline-start: auto;
}
</style>
