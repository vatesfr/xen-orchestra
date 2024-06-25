<template>
  <UiCard>
    <CardTitle>
      {{ title }}
      <template #info>
        <UiButton level="tertiary" size="extra-small" :right-icon="faAngleRight">
          <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
          <RouterLink to="/">See all</RouterLink>
          <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
        </UiButton>
      </template>
    </CardTitle>
    <div class="chart-and-legends">
      <DonutChart :segments :icon :max-value="donutMaxValue" />
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
      <CardNumbers :label="$t('total')" :value="totalValue" size="small" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/button/UiButton.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
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
  segments: Segment[]
  donutMaxValue: number
  totalValue: number
  icon?: IconDefinition
  legends: Legend[]
}

defineProps<Props>()
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

  @media (--desktop) {
    justify-content: flex-end;
  }
}
</style>
