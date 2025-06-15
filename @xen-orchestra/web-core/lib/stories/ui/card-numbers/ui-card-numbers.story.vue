<template>
  <ComponentStory :params>
    <UiCardNumbers v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    label: {
      preset: 'Label',
      type: 'string',
      required: true,
    },
    size: {
      preset: 'medium' as const,
      type: '"small" | "medium"',
      required: true,
      widget: choice('small', 'medium'),
    },
    value: {
      preset: ref<number>(),
      type: 'number',
    },
    unit: {
      preset: ref<string>(),
      type: 'string',
    },
    max: {
      preset: ref<number>(),
      type: 'number',
    },
  },
})
</script>
