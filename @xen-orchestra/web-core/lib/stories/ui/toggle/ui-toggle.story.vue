<template>
  <ComponentStory :params>
    <UiToggle v-bind="bindings">{{ settings.defaultSlotContent }}</UiToggle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    busy: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    modelValue: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Default slot content' },
  },
  settings: {
    defaultSlotContent: {
      preset: 'Label',
      help: 'Content for default slot',
    },
  },
})
</script>
