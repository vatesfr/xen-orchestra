<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('label').str().widget().preset('Label'),
      prop('info').str().widget().preset('message'),
      prop('vertical').bool().widget(),
      prop('gap').required().enum('narrow', 'wide').preset('wide').widget(),
      slot().help('Meant to receive a list of radio button components'),
      slot('label').help('Meant to receive a label UiLabel component or another component'),
      slot('info').help('Meant to receive a message info or UiInfo component or another component'),
      setting('richRadioButton').widget(boolean()),
    ]"
  >
    <UiRadioButtonGroup v-bind="properties">
      <component
        :is="settings.richRadioButton === true ? UiRichRadioButton : UiRadioButton"
        v-for="(label, index) in labels"
        :key="index"
        v-model="selectedRadio"
        v-bind="richButtonProps(properties, settings.richRadioButton)"
        :value="`radio-${index}`"
      >
        {{ label }}
      </component>
    </UiRadioButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget.ts'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import { ref } from 'vue'
import imageUrl from '../../../../assets/color-mode-dark.svg'

const selectedRadio = ref('')

const labels = ref(['Label 1', 'Label 2', 'Label 3'])

const richButtonProps = (properties: any, richRadioButton: boolean) => {
  if (richRadioButton) {
    return {
      ...properties,
      src: imageUrl,
      alt: 'image description',
      size: 'medium',
    }
  }
  return properties
}
</script>
