<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('legend').preset('Legend').required().widget(),
      prop('value').preset(25).required().widget(),
      prop('max').num().widget(),
      prop('steps').arr('number').help('Meant to display steps values under the progress bar. See Presets.').widget(),
    ]"
    :presets
  >
    <UiProgressBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

const presets = {
  '>= 80': {
    props: {
      legend: 'Ram usage',
      value: 80,
      steps: undefined,
    },
  },
  '>= 90': {
    props: {
      legend: 'Ram usage',
      value: 95,
      steps: undefined,
    },
  },
  'With steps': {
    props: {
      legend: 'Ram usage',
      value: 50,
      steps: [0, 100, 200],
    },
  },
  'With steps >= 80': {
    props: {
      legend: 'Ram usage',
      value: 160,
      steps: [0, 100, 200],
    },
  },
}
</script>
