<template>
  <ComponentStory :params :presets>
    <UiProgressBar v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    legend: {
      preset: 'Legend',
      required: true,
    },
    value: {
      preset: 25,
      required: true,
    },
    max: {
      preset: ref<number>(),
      type: 'number',
    },
    showSteps: {
      preset: ref<boolean>(),
      type: 'boolean',
      help: 'Force steps display under the progress bar even if <= 100%.',
    },
  },
})

const presets: Record<string, () => void> = {
  'Warning >= 80%': () => {
    bindings.legend = 'Ram usage'
    bindings.value = 80
  },
  'Danger >= 90%': () => {
    bindings.legend = 'Ram usage'
    bindings.value = 95
  },
  '> 100%': () => {
    bindings.legend = 'Ram usage'
    bindings.value = 250
    bindings.max = 200
  },
}
</script>
