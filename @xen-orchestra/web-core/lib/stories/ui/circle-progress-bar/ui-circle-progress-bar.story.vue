<template>
  <ComponentStory :params :presets>
    <UiCircleProgressBar v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCircleProgressBar, {
  type CircleProgressBarAccent,
  type CircleProgressBarSize,
} from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    accent: {
      preset: 'info' as CircleProgressBarAccent,
      type: 'CircleProgressBarAccent',
      widget: choice('info', 'warning', 'danger'),
      required: true,
    },
    size: {
      preset: 'large' as CircleProgressBarSize,
      type: 'CircleProgressBarSize',
      widget: choice('extra-small', 'small', 'medium', 'large'),
      required: true,
    },
    value: {
      preset: 75,
      required: true,
    },
    maxValue: {
      preset: ref<number>(),
      type: 'number',
    },
  },
})

const presets: Record<string, () => void> = {
  'Half of 500': () => {
    bindings.value = 250
    bindings.maxValue = 500
    bindings.size = 'medium'
    bindings.accent = 'info'
  },
  '75% of 300': () => {
    bindings.value = 225
    bindings.maxValue = 300
    bindings.size = 'medium'
    bindings.accent = 'info'
  },
}
</script>
