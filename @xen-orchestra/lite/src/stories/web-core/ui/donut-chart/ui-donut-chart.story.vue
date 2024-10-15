<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('segments').type('DonutSegment[]').required().preset(segments).widget(object()), iconProp()]"
  >
    <UiDonutChart v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp } from '@/libs/story/story-param'
import { object } from '@/libs/story/story-widget'
import UiDonutChart, { type DonutSegment } from '@core/components/ui/donut-chart/UiDonutChart.vue'

const segments: DonutSegment[] = [
  { value: 13, accent: 'info' },
  { value: 14, accent: 'neutral' },
  { value: 16, accent: 'success' },
  { value: 22, accent: 'warning' },
  { value: 35, accent: 'danger' },
  { value: 12, accent: 'muted' },
]
</script>
