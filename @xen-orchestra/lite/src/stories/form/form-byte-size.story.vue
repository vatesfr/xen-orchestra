<template>
  <ComponentStory :params>
    <FormByteSize v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import FormByteSize from '@/components/form/FormByteSize.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  models: {
    modelValue: {
      preset: 4096,
      required: true,
      help: 'The size in bytes',
    },
  },
})
</script>
