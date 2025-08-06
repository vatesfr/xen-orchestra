<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('steps').type('[number, number]').widget(),
      prop('accent').enum('warning', 'danger').preset('warning').widget(),
      prop('message').preset('Message').widget(),
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
      message: 'overload warning',
    },
  },
  'Danger > 300%': {
    props: {
      steps: [2, 4],
      accent: 'danger',
      message: 'overload warning',
    },
  },
}
</script>
