<template>
  <ComponentStory :params>
    <UiRadioButton v-bind="bindings">{{ settings.defaultSlot }}</UiRadioButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiRadioButton, { type RadioButtonAccent } from '@core/components/ui/radio-button/UiRadioButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { boolean, choice, text } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'brand' as RadioButtonAccent,
      widget: choice<RadioButtonAccent>('brand', 'warning', 'danger'),
      required: true,
    },
    value: {
      preset: ref('foo'),
      type: 'any',
      widget: false,
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    modelValue: {
      preset: ref(),
      type: 'any',
      widget: false,
    },
  },
  slots: {
    default: { help: 'Meant to receive a label' },
  },
  settings: {
    defaultSlot: {
      preset: 'Label',
      widget: text(),
    },
    checked: {
      preset: false,
      widget: boolean(),
    },
  },
})
</script>
