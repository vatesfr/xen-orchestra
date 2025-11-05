<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('max').num().default(100).widget(),
      prop('warning')
        .obj('{ accent?: IconAccent; tooltip?: string }')
        .widget()
        .help('Warning icon to display next to cap percentage'),
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
    props: {},
  },
  'Warning + Max: 300%': {
    props: {
      max: 300,
      warning: {
        accent: 'warning',
        tooltip: 'overload warning',
      },
    },
  },
  'Danger + Max: 400%': {
    props: {
      max: 400,
      warning: {
        accent: 'danger',
        tooltip: 'overload danger',
      },
    },
  },
}
</script>
