<template>
  <!-- <UiCard> -->

  <!-- 
  <CardTitle
      >{{ title }}
      <template #info
        >{{ settings.infoSlotContent
  }}<RouterLink :to="titleLink">
    <UiButton level="tertiary" size="extra-small" :right-icon="faAngleRight">See all</UiButton></RouterLink
  >
        -->

  <!--
  </template
      >
  
    </CardTitle> 
    -->

  <div class="chart-and-legends">
    <DonutChart :segments />
    <ul class="legends">
      <UiLegend
        v-for="(legend, index) in legends"
        :key="index"
        :color="legend.color"
        :value="legend.value"
        :unit="legend.unit"
        :tooltip="legend.tooltip"
        >Label</UiLegend
      >
    </ul>
  </div>
  <div class="total">
    <span class="typo c2-semi-bold">Total</span><span class="typo h3-semi-bold">{{ total }}</span>
  </div>
  <!-- </UiCard> -->
</template>

<script lang="ts" setup>
import DonutChart from '@core/components/DonutChart.vue'
import UiLegend from '@core/components/UiLegend.vue'
// import UiButton from '@core/components/button/UiButton.vue'
// import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

type LegendColor = 'default' | 'success' | 'warning' | 'error' | 'disabled' | 'dark-blue'

type Segment = {
  value: number
  color: 'success' | 'warning' | 'error' | 'unknown'
}

type Legend = {
  color: LegendColor
  value?: number
  unit?: string
  tooltip?: string
}

defineProps<{
  title: string
  titleLink: string
  segments: Segment[]
  total: number
  icon?: IconDefinition
  legends: Legend[]
}>()
</script>

<style lang="postcss" scoped>
.chart-and-legends {
  display: flex;
  align-items: center;
  gap: 3.2rem;
}

.legends {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
</style>
