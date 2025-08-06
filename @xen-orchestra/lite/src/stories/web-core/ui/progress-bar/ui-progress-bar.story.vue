<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('legend').preset('Legend').required().widget(),
      prop('value').preset(25).required().widget(),
      prop('max').num().widget().help(`Max will be required when displayMode is set to 'value'.`),
      prop('displayMode').enum('value', 'percent').required().preset('percent').widget(),
      prop('thresholds').obj('{ warning: number , danger: number }').preset({ warning: 100, danger: 300 }).widget(),
    ]"
  >
    <UiProgressBar v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
</script>
