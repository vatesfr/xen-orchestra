<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('label').str().widget().preset('Label'),
      prop('info').str().widget().preset('message'),
      prop('vertical').bool().widget(),
      prop('size').enum('small', 'medium').preset('medium').widget(),
      prop('rich').bool().widget(),
      prop('src').str().help('Image URL for rich mode'),
      prop('alt').str().help('Alt text for image'),
      slot().help('Meant to receive a list of radio button components'),
      slot('label').help('Meant to receive a label UiLabel component or another component'),
      slot('info').help('Meant to receive a message info or UiInfo component or another component'),
    ]"
  >
    <UiRadioButtonGroup v-bind="properties">
      <UiRadioButton
        v-for="(label, index) in labels"
        :key="index"
        v-model="selectedRadio"
        v-bind="properties"
        :value="`radio-${index}`"
        :src="properties.rich ? imageUrl : undefined"
        :alt="properties.rich ? properties.alt : undefined"
      >
        {{ label }}
      </UiRadioButton>
    </UiRadioButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { ref } from 'vue'
import imageUrl from '../../../../assets/color-mode-dark.svg'

const selectedRadio = ref('')

const labels = ref(['Label 1', 'Label 2', 'Label 3'])
</script>
