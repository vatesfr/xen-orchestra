<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('segments')
        .preset(segments)
        .required()
        .obj()
        .help('Array of objects with value and color properties')
        .widget(),
      prop('max-value').preset(100).type('number').widget().help('Maximum value for the stacked bar'),
    ]"
  >
    <StackedBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import StackedBar from '@core/components/stacked-bar/StackedBar.vue'

const segments = [
  { value: 30, color: 'primary' },
  { value: 20, color: 'success' },
  { value: 10, color: 'warning' },
  { value: 3, color: 'danger' },
]
</script>
