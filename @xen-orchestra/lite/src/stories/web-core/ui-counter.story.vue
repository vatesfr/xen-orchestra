<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').num().required().preset(2).widget(),
      prop('suffix').str().widget(),
      prop('large').bool().default(false).widget(),
      prop('color').type(`Color | 'black'`).enum('info', 'success', 'warning', 'error', 'black').widget(),
    ]"
  >
    <UiCounter v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCounter from '@core/components/UiCounter.vue'
</script>
