<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('segments').required().preset(segments), prop('title').preset(title), iconProp()]"
  >
    <VtsDonutChartWithLegend v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { open: openLegendModal } = useOverlay({
  component: () => import('@/stories/web-core/ui/legend/LegendInfoModal.vue'),
  events: {
    onClose: true,
  },
})

const title: DonutChartWithLegendProps['title'] = {
  label: 'Chart Title',
  iconTooltip: 'Some tooltip',
  icon: 'fa:info-circle',
}

const segments: DonutChartWithLegendProps['segments'] = [
  { value: 16, accent: 'success', label: 'Online' },
  { value: 22, accent: 'warning', label: 'Maintenance', onInfoClick: () => openLegendModal() },
  { value: 35, accent: 'danger', label: 'Offline' },
  { value: 12, accent: 'muted', label: 'Unknown' },
]
</script>
