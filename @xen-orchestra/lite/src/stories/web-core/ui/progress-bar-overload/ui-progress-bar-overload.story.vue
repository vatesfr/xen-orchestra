<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('legend').preset('Legend').required().widget(),
      prop('value').preset(25).required().widget(),
      prop('max').preset(100).num().widget().help(`Max will be required when displayMode is set to 'value'.`),
    ]"
  >
    <UiProgressBarOverload v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiProgressBarOverload from '@core/components/ui/progress-bar-overload/UiProgressBarOverload.vue'
</script>
