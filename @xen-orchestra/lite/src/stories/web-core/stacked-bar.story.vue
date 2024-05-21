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
    :presets="presets"
  >
    <StackedBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import StackedBar from '@core/components/StackedBar.vue'
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'

const segments = ref([
  { value: 14, color: 'success' },
  { value: 16, color: 'info' },
  { value: 24, color: 'warning' },
  { value: 30, color: 'error' },
])

const maxValue = ref(100)

const presets = {
  'Network bandwidth': {
    props: {
      segments: segments.value,
      'max-value': maxValue.value,
    },
  },
}
</script>
