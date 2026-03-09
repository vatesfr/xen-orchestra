<template>
  <div class="vts-stacked-bar-with-legend">
    <UiStackedBar :segments :max-value="maxValue" />
    <VtsLegendList class="list" :horizontal="!uiStore.isSmall">
      <UiLegend
        v-for="segment in segments"
        :key="segment.label"
        :accent="segment.accent"
        :modal-info="segment.modalInfo"
        :unit="segment.unit"
        :value="segment.value"
        @open-modal="emit('openModal')"
      >
        {{ segment.label }}
      </UiLegend>
    </VtsLegendList>
  </div>
</template>

<script setup lang="ts">
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend, { type LegendItemProps } from '@core/components/ui/legend/UiLegend.vue'
import UiStackedBar, { type StackedBarProps } from '@core/components/ui/stacked-bar/UiStackedBar.vue'
import { useUiStore } from '@core/stores/ui.store'

type Segment = StackedBarProps['segments'][number] & LegendItemProps & { label: string }

export type StackedBarWithLegendProps = {
  segments: Segment[]
  maxValue?: StackedBarProps['maxValue']
}

defineProps<StackedBarWithLegendProps>()

const emit = defineEmits<{
  openModal: []
}>()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.vts-stacked-bar-with-legend {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .list {
    margin-inline-start: auto;
  }
}
</style>
