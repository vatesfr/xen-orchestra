<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('segments').type('array').required().preset(segments).widget(),
      iconProp(),
      prop('maxValue').type('number').widget().help('maxValue must be greater than the sum of the segments'),
    ]"
  >
    <DonutChart v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp } from '@/libs/story/story-param'
import DonutChart from '@core/components/DonutChart.vue'

const segments = [
  { value: 16, color: 'success' },
  { value: 22, color: 'warning' },
  { value: 35, color: 'error' },
  { value: 12, color: 'unknown' },
]
</script>
