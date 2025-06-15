<template>
  <ComponentStory :params>
    <UiRadioButtonGroup v-bind="bindings">
      <UiRadioButton v-for="(label, index) in labels" :key="index" v-model="model" :value="index" accent="brand">
        {{ label }}
      </UiRadioButton>
    </UiRadioButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup, {
  type RadioButtonGroupAccent,
} from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const model = ref()
const labels = ['Radio 1', 'Radio 2', 'Radio 3']

const { params, bindings } = useStory({
  props: {
    accent: {
      preset: 'brand' as RadioButtonGroupAccent,
      widget: choice<RadioButtonGroupAccent>('brand', 'warning', 'danger'),
      required: true,
    },
    label: {
      preset: 'Label',
    },
    info: {
      preset: 'This is a message',
    },
    vertical: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Meant to receive a list of radio button components' },
    label: { help: 'Meant to receive a label UiLabel component or another component' },
    info: { help: 'Meant to receive a message info or UiInfo component or another component' },
  },
})
</script>
