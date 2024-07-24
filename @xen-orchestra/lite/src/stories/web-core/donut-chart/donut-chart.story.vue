<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('segments').type('DonutSegment[]').required().preset(segments).widget(object()), iconProp()]"
  >
    <DonutChart v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp } from '@/libs/story/story-param'
import { object } from '@/libs/story/story-widget'
import DonutChart, { type DonutSegment } from '@core/components/donut-chart/DonutChart.vue'

const segments: DonutSegment[] = [
  { value: 16, color: 'success' },
  { value: 22, color: 'warning' },
  { value: 35, color: 'danger' },
  { value: 12, color: 'disabled' },
]
</script>
