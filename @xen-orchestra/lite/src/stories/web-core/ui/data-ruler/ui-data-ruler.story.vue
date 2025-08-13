<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('steps').type('[number, number]').widget(),
      prop('accent').enum('warning', 'danger').widget(),
      prop('tooltip').str().widget().help('Message to display in the tooltip when the last step exceeds 100%'),
    ]"
    :presets
  >
    <UiDataRuler v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'

const presets = {
  Default: {
    props: {
      steps: [0.5, 1],
    },
  },
  'Warning > 100%': {
    props: {
      steps: [1.5, 3],
      accent: 'warning',
      tooltip: 'overload warning',
    },
  },
  'Danger > 300%': {
    props: {
      steps: [2, 4],
      accent: 'danger',
      tooltip: 'overload warning',
    },
  },
}
</script>
