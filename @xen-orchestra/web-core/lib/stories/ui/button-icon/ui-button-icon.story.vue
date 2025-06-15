<template>
  <ComponentStory :params>
    <UiButtonIcon v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButtonIcon, {
  type ButtonIconAccent,
  type ButtonIconSize,
} from '@core/components/ui/button-icon/UiButtonIcon.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice, object } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    icon: {
      preset: faEllipsis,
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    size: {
      preset: ref<ButtonIconSize>('medium'),
      type: 'ButtonIconSize',
      required: true,
      widget: choice('small', 'medium', 'large'),
    },
    accent: {
      preset: ref<ButtonIconAccent>('brand'),
      type: 'ButtonIconAccent',
      required: true,
      widget: choice('brand', 'warning', 'danger'),
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    selected: {
      preset: ref(),
      type: 'boolean',
    },
    dot: {
      preset: ref(),
      type: 'boolean',
    },
    targetScale: {
      preset: ref({
        x: 2,
        y: 2,
      }),
      type: 'number | { x: number; y: number }',
      default: 1,
      help: 'Meant to increase click target size if needed',
      widget: object(),
    },
  },
})
</script>
