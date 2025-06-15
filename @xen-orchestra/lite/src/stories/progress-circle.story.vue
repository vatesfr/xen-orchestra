<template>
  <ComponentStory :params :presets>
    <ProgressCircle v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ProgressCircle from '@/components/ProgressCircle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    value: {
      preset: 25,
      required: true,
    },
    'max-value': {
      default: 100,
    },
  },
})

const presets: Record<string, () => void> = {
  'Half of 500': () => {
    bindings['max-value'] = 500
    bindings.value = 250
  },
  '75% of 300': () => {
    bindings['max-value'] = 300
    bindings.value = 225
  },
}
</script>

<style lang="postcss" scoped>
.progress-circle {
  max-width: 30rem;
}
</style>
