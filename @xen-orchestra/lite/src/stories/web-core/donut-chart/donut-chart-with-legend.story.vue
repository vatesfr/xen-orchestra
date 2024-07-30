<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('segments').required().preset(segments), prop('title').preset(title), iconProp()]"
  >
    <DonutChartWithLegend v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const title: DonutChartWithLegendProps['title'] = {
  label: 'Chart Title',
  iconTooltip: 'Some tooltip',
  icon: faInfoCircle,
}

const segments: DonutChartWithLegendProps['segments'] = [
  { value: 16, color: 'success', label: 'Online' },
  { value: 22, color: 'warning', label: 'Maintenance', tooltip: 'Accessible in read-only' },
  { value: 35, color: 'danger', label: 'Offline' },
  { value: 12, color: 'disabled', label: 'Unknown' },
]
</script>
