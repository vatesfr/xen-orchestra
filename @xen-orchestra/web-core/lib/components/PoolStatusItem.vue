<template>
  <UiCard>
    <CardTitle>
      {{ title }}
      <template #info>
        <RouterLink :to="titleLink">
          <UiButton level="tertiary" size="extra-small" :right-icon="faAngleRight">{{ titleLinkLabel }}</UiButton>
        </RouterLink>
      </template>
    </CardTitle>
    <div class="chart-and-legends">
      <DonutChart :segments :icon />
      <ul class="legends">
        <UiLegend
          v-for="(legend, index) in legends"
          :key="index"
          :color="legend.color"
          :value="legend.value"
          :unit="legend.unit"
          :tooltip="legend.tooltip"
        >
          {{ legend.label }}
        </UiLegend>
      </ul>
    </div>
    <div class="total">
      <span class="typo c2-semi-bold">{{ totalLabel }}</span
      ><span class="typo h3-semi-bold">{{ totalValue }}</span>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/button/UiButton.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import DonutChart from '@core/components/DonutChart.vue'
import UiCard from '@core/components/UiCard.vue'
import UiLegend from '@core/components/UiLegend.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'

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
  label: string
}

interface Props {
  title: string
  titleLink: string
  titleLinkLabel?: string
  segments: Segment[]
  totalValue: number
  totalLabel?: string
  icon?: IconDefinition
  legends: Legend[]
}

withDefaults(defineProps<Props>(), {
  titleLinkLabel: 'See all',
  totalLabel: 'Total',
})
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
