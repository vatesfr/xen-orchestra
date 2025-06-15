<template>
  <ComponentStory :params>
    <UiCheckbox v-bind="bindings">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiCheckbox>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCheckbox, { type CheckboxAccent } from '@core/components/ui/checkbox/UiCheckbox.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice, text } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      preset: 'brand' as CheckboxAccent,
      type: 'CheckboxAccent',
      required: true,
      widget: choice('brand', 'warning', 'danger'),
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    modelValue: {
      preset: ref<boolean | string[]>(),
      type: 'boolean | string[]',
    },
  },
  slots: {
    default: { help: 'The default slot content' },
    info: { help: 'Information slot' },
  },
  settings: {
    defaultSlot: {
      preset: 'Label',
      widget: text(),
    },
    info: {
      preset: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      widget: text(),
    },
  },
})
</script>
