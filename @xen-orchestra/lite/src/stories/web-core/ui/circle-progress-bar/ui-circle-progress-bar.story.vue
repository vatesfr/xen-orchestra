<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').num().preset(75).required().widget(),
      prop('maxValue').num().preset(100).widget(),
      prop('accent')
        .type('CircleProgressBarAccent')
        .required()
        .enum('brand', 'info', 'warning', 'danger')
        .preset('info')
        .widget(),
      prop('size')
        .type('CircleProgressBarSize')
        .required()
        .enum('extra-small', 'small', 'medium', 'large')
        .preset('large')
        .widget(),
      prop('noValue').bool().widget(),
    ]"
    :presets
  >
    <UiCircleProgressBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'

const presets = {
  'Half of 500': {
    props: {
      value: 250,
      maxValue: 500,
      size: 'medium',
      accent: 'info',
      noValue: false,
    },
  },
  '75% of 300': {
    props: {
      value: 225,
      maxValue: 300,
      size: 'medium',
      accent: 'info',
      noValue: false,
    },
  },
  'Value above max (success)': {
    props: {
      value: 150,
      maxValue: 100,
      size: 'medium',
      accent: 'info',
      noValue: false,
    },
  },
  'Value above max (warning)': {
    props: {
      value: 150,
      maxValue: 100,
      size: 'medium',
      accent: 'warning',
      noValue: false,
    },
  },
  'Brand ring without value': {
    props: {
      value: 1,
      maxValue: 3,
      size: 'small',
      accent: 'brand',
      noValue: true,
    },
  },
}
</script>
