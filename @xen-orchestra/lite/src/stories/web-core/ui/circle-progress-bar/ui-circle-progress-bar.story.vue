<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').num().preset(75).required().widget(),
      prop('maxValue').num().preset(100).widget(),
      prop('accent').required().enum('info', 'warning', 'danger').preset('info').widget(),
      prop('size').required().enum('extra-small', 'small', 'medium', 'large').preset('large').widget(),
    ]"
    :presets
  >
    <UiCircleProgressBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'

const presets = {
  'Half of 500': {
    props: {
      'max-value': 500,
      value: 250,
      size: 'medium',
      accent: 'info',
      maxValue: 500,
    },
  },
  '75% of 300': {
    props: {
      'max-value': 300,
      value: 225,
      size: 'medium',
      accent: 'info',
    },
  },
}
</script>
