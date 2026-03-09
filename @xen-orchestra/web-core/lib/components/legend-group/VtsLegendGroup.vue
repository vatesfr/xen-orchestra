<template>
  <div class="vts-legend-group">
    <UiLegendTitle v-if="title" :icon="title.icon" :icon-tooltip="title.iconTooltip">
      {{ title.label }}
    </UiLegendTitle>
    <VtsLegendList>
      <UiLegend
        v-for="item in items"
        :key="item.label"
        :accent="item.accent"
        :modal-info="item.modalInfo"
        :unit="item.unit"
        :value="item.value"
        @open-modal="emit('openModal', item.label)"
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

const emit = defineEmits<{
  openModal: [label: string]
}>()
</script>

<style lang="postcss" scoped>
.vts-legend-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
