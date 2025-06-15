<template>
  <ComponentStory :params>
    <UiStackedBar v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiStackedBar, { type StackedBarProps } from '@core/components/ui/stacked-bar/UiStackedBar.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { object } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const segments: StackedBarProps['segments'] = [
  {
    value: 30,
    accent: 'info',
    unit: 'GiB',
  },
  {
    value: 20,
    accent: 'success',
    unit: 'GiB',
  },
  {
    value: 10,
    accent: 'warning',
    unit: 'GiB',
  },
  {
    value: 3,
    accent: 'danger',
    unit: 'GiB',
  },
]

const { params, bindings } = useStory({
  props: {
    segments: {
      preset: segments,
      required: true,
      description: 'Array of objects with value and color properties',
      widget: object(),
    },
    maxValue: {
      preset: {
        value: 100,
        unit: 'GiB',
      },
      description: 'Maximum value for the stacked bar',
      widget: object(),
    },
  },
})
</script>
