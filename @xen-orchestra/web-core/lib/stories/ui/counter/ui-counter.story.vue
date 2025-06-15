<template>
  <ComponentStory :params>
    <UiCounter v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCounter, {
  type CounterAccent,
  type CounterSize,
  type CounterVariant,
} from '@core/components/ui/counter/UiCounter.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice, text } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    value: {
      type: 'string | number',
      required: true,
      preset: 2,
      widget: text(),
    },
    accent: {
      preset: 'brand' as CounterAccent,
      type: 'CounterAccent',
      widget: choice('brand', 'neutral', 'info', 'success', 'warning', 'danger', 'muted'),
      required: true,
    },
    variant: {
      type: 'CounterVariant',
      preset: 'primary' as CounterVariant,
      widget: choice('primary', 'secondary'),
      required: true,
    },
    size: {
      type: 'CounterSize',
      preset: 'medium' as CounterSize,
      widget: choice('small', 'medium'),
      required: true,
    },
  },
})
</script>
