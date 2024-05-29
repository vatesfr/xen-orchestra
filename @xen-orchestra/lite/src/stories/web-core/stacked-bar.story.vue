<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('segments')
        .preset(segments)
        .required()
        .obj('Segments')
        .help('Array of objects with value and color properties')
        .widget(),
      prop('max-value').preset(100).type('number').widget().help('Maximum value for the progress bar'),
    ]"
  >
    <StackedBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import StackedBar from '@core/components/StackedBar.vue'
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'

const segments = [
  { value: 30, color: 'success' },
  { value: 20, color: 'info' },
  { value: 10, color: 'warning' },
  { value: 4, color: 'error' },
]
</script>
