<template>
  <ComponentStory :params>
    <VtsStackedBarWithLegend v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const segments: StackedBarWithLegendProps['segments'] = [
  {
    value: 10.5,
    unit: 'GB',
    accent: 'info',
    label: 'XO backups',
  },
  {
    value: 6.5,
    unit: 'GB',
    accent: 'warning',
    label: 'Other',
  },
]

const { params, bindings } = useStory({
  props: {
    segments: {
      preset: segments,
      required: true,
      widget: true,
    },
    'max-value': {
      preset: {
        value: 50,
        unit: 'GB',
      },
      help: 'Maximum value for the stacked bar',
    },
  },
})
</script>
