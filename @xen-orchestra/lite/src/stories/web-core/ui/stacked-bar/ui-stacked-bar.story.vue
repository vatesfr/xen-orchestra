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
      prop('max-value').preset({ value: 100, unit: 'GiB' }).obj().widget().help('Maximum value for the stacked bar'),
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
  { value: 30, accent: 'info', unit: 'GiB' },
  { value: 20, accent: 'success', unit: 'GiB' },
  { value: 10, accent: 'warning', unit: 'GiB' },
  { value: 3, accent: 'danger', unit: 'GiB' },
]
</script>
