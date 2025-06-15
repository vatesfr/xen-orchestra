<template>
  <ComponentStory :params>
    <UiCheckboxGroup v-bind="bindings">
      <UiCheckbox v-for="(label, index) in labels" :key="index" accent="brand">
        {{ label }}
      </UiCheckbox>
    </UiCheckboxGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const labels = ['Checkbox 1', 'Checkbox 2', 'Checkbox 3']

const { params, bindings } = useStory({
  props: {
    accent: {
      preset: 'brand' as const,
      type: '"brand" | "warning" | "danger"',
      required: true,
      widget: choice('brand', 'warning', 'danger'),
    },
    label: {
      preset: 'Label',
    },
    info: {
      preset: 'message',
    },
    vertical: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {
      help: 'Meant to receive a list of checkboxes component',
    },
    label: {
      help: 'Meant to receive a label UiLabel component or another component',
    },
    info: {
      help: 'Meant to receive a message info or UiInfo component or another component',
    },
  },
})
</script>
