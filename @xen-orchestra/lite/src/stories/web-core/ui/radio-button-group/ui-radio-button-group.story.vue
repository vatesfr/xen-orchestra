<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('radioType').enum('default', 'rich').preset('default').widget(),
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('label').str().widget().preset('Label'),
      prop('info').str().widget().preset('message'),
      prop('vertical').bool().widget(),
      prop('rich').bool().widget().help('Available only if radioType = rich'),
      prop('layout')
        .enum('grid', 'flex')
        .preset('flex')
        .widget()
        .help('Only for rich radio, grid for small size and flex for medium size'),
      prop('size').enum('small', 'medium').preset('medium').widget(),
      slot().help('Meant to receive a list of radio button components'),
      slot('label').help('Meant to receive a label UiLabel component or another component'),
      slot('info').help('Meant to receive a message info or UiInfo component or another component'),
    ]"
  >
    <UiRadioButtonGroup v-bind="properties">
      <component
        :is="properties.radioType === 'rich' ? UiRichRadioButton : UiRadioButton"
        v-for="(label, index) in labels"
        :key="index"
        v-model="selectedRadio"
        v-bind="{
          ...properties,
          rich: properties.radioType === 'rich' ? properties.rich : false,
        }"
        :value="`radio-${index}`"
        :src="imageUrl"
        :alt="properties.alt"
      >
        {{ label }}
      </component>
    </UiRadioButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import { ref } from 'vue'
import imageUrl from '../../../../assets/color-mode-dark.svg'

const selectedRadio = ref('')

const labels = ref(['Label 1', 'Label 2', 'Label 3'])
</script>
