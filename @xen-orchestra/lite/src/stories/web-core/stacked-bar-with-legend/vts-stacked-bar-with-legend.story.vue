<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('segments').preset(segments).required(),
      prop('max-value').preset(50).type('number').widget().help('Maximum value for the stacked bar'),
    ]"
  >
    <VtsStackedBarWithLegend v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'

const segments: StackedBarWithLegendProps['segments'] = [
  { value: 10.5, unit: 'GB', accent: 'info', label: 'XO backups' },
  { value: 6.5, unit: 'GB', accent: 'warning', label: 'Other' },
]
</script>
