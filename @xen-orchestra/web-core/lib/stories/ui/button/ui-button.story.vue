<template>
  <ComponentStory :params>
    <UiButton v-bind="bindings">{{ settings.label }}</UiButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButton, {
  type ButtonAccent,
  type ButtonSize,
  type ButtonVariant,
} from '@core/components/ui/button/UiButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    variant: {
      preset: 'primary' as ButtonVariant,
      type: 'ButtonVariant',
      required: true,
      widget: choice('primary', 'secondary', 'tertiary'),
    },
    accent: {
      preset: 'brand' as ButtonAccent,
      type: 'ButtonAccent',
      required: true,
      widget: choice('brand', 'warning', 'danger'),
    },
    size: {
      preset: 'medium' as ButtonSize,
      type: 'ButtonSize',
      required: true,
      widget: choice('small', 'medium'),
    },
    busy: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    lockIcon: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    leftIcon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  settings: {
    label: {
      preset: 'Click me',
    },
  },
})
</script>
