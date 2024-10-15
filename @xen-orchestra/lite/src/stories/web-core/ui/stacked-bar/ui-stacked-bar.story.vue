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
    <UiStackedBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiStackedBar from '@core/components/ui/stacked-bar/UiStackedBar.vue'

const segments = [
  { value: 30, accent: 'info' },
  { value: 20, accent: 'success' },
  { value: 10, accent: 'warning' },
  { value: 3, accent: 'danger' },
]
</script>
