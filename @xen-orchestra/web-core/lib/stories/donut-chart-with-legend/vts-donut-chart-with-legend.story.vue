<template>
  <ComponentStory :params>
    <VtsDonutChartWithLegend v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const title: DonutChartWithLegendProps['title'] = {
  label: 'Chart Title',
  iconTooltip: 'Some tooltip',
  icon: faInfoCircle,
}

const segments: DonutChartWithLegendProps['segments'] = [
  { value: 16, accent: 'success', label: 'Online' },
  { value: 22, accent: 'warning', label: 'Maintenance', tooltip: 'Accessible in read-only' },
  { value: 35, accent: 'danger', label: 'Offline' },
  { value: 12, accent: 'muted', label: 'Unknown' },
]

const { params, bindings } = useStory({
  props: {
    segments: {
      preset: segments,
      type: 'object',
      required: true,
    },
    title: {
      preset: title,
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
})
</script>
