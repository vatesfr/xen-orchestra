<template>
  <ComponentStory :params>
    <UiInput v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiInput, { type InputAccent, type InputType } from '@core/components/ui/input/UiInput.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    accent: {
      preset: 'brand' as InputAccent,
      widget: choice('brand', 'warning', 'danger'),
      required: true,
    },
    id: {
      preset: ref<string>(),
      type: 'string',
      widget: false,
    },
    required: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    type: {
      preset: 'text' as InputType,
      widget: choice<InputType>('text', 'number', 'password', 'search'),
    },
    icon: {
      preset: ref<IconDefinition>(),
      widget: iconChoice(),
    },
    rightIcon: {
      preset: ref<IconDefinition>(),
      widget: iconChoice(),
    },
    clearable: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    modelValue: {
      preset: '',
      type: 'string | number',
    },
  },
  slots: {
    rightIcon: { help: 'Can be used in place of rightIcon prop' },
  },
})
</script>
