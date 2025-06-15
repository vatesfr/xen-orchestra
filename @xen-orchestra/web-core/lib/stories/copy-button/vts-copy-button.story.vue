<template>
  <ComponentStory :params>
    <VtsCopyButton v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    value: {
      preset: 'hello world',
      required: true,
    },
  },
})
</script>
