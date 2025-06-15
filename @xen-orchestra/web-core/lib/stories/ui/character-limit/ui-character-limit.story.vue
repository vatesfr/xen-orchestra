<template>
  <ComponentStory :params :presets>
    <UiCharacterLimit v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    count: {
      preset: 10,
      required: true,
    },
    max: {
      preset: 200,
      required: true,
    },
  },
})

const presets = {
  'Exceeding max value': () => {
    bindings.count = 250
    bindings.max = 200
  },
}
</script>
