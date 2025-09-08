<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').type('ProgressBarAccent').enum('info', 'warning', 'danger').preset('info').required().widget(),
      prop('fill-width').str().preset('25%').required().widget(),
      prop('legend')
        .obj('ProgressBarLegend')
        .widget()
        .preset({ label: 'Foo', value: '12 / 48' })
        .help('{ label: string; value?: string | number }'),
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
  'Warning >= 80%': {
    props: {
      legend: 'Ram usage',
      value: 80,
      displayMode: 'percent',
    },
  },
  'Danger >= 90%': {
    props: {
      legend: 'Ram usage',
      value: 95,
      displayMode: 'percent',
    },
  },
  'With steps': {
    props: {
      legend: 'Ram usage',
      value: 250,
      max: 200,
      displayMode: 'value',
    },
  },
}
</script>
