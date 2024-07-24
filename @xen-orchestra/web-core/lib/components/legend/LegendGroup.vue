<template>
  <div class="legend-group">
    <LegendTitle v-if="title" :icon="title.icon" :icon-tooltip="title.iconTooltip">
      {{ title.label }}
    </LegendTitle>
    <LegendList class="list">
      <LegendItem
        v-for="item in items"
        :key="item.label"
        :color="item.color"
        :tooltip="item.tooltip"
        :unit="item.unit"
        :value="item.value"
      >
        {{ item.label }}
      </LegendItem>
    </LegendList>
  </div>
</template>

<script lang="ts" setup>
import LegendItem, { type LegendItemProps } from '@core/components/legend/LegendItem.vue'
import LegendList from '@core/components/legend/LegendList.vue'
import LegendTitle, { type LegendTitleProps } from '@core/components/LegendTitle.vue'

export type LegendGroupProps = {
  items: (LegendItemProps & { label: string })[]
  title?: LegendTitleProps & { label: string }
}

defineProps<LegendGroupProps>()
</script>

<style lang="postcss" scoped>
.legend-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.list {
  padding-left: 1.6rem;
}
</style>
