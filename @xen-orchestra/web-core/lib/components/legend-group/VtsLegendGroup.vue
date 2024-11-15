<template>
  <div class="vts-legend-group">
    <UiLegendTitle v-if="title" :icon="title.icon" :icon-tooltip="title.iconTooltip">
      {{ title.label }}
    </UiLegendTitle>
    <VtsLegendList class="list">
      <UiLegend
        v-for="item in items"
        :key="item.label"
        :accent="item.accent"
        :tooltip="item.tooltip"
        :unit="item.unit"
        :value="item.value"
      >
        {{ item.label }}
      </UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend, { type LegendItemProps } from '@core/components/ui/legend/UiLegend.vue'
import UiLegendTitle, { type LegendTitleProps } from '@core/components/ui/legend-title/UiLegendTitle.vue'

export type LegendGroupProps = {
  items: (LegendItemProps & { label: string })[]
  title?: LegendTitleProps & { label: string }
}

defineProps<LegendGroupProps>()
</script>

<style lang="postcss" scoped>
.vts-legend-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .list {
    padding-left: 1.6rem;
  }
}
</style>
