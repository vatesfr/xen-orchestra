<template>
  <ComponentStory :params>
    <UiDonutChart v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiDonutChart, { type DonutSegment } from '@core/components/ui/donut-chart/UiDonutChart.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const segments: DonutSegment[] = [
  {
    value: 13,
    accent: 'info',
  },
  {
    value: 14,
    accent: 'neutral',
  },
  {
    value: 16,
    accent: 'success',
  },
  {
    value: 22,
    accent: 'warning',
  },
  {
    value: 35,
    accent: 'danger',
  },
  {
    value: 12,
    accent: 'muted',
  },
]

const { params, bindings } = useStory({
  props: {
    segments: {
      preset: segments,
      required: true,
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
})
</script>
