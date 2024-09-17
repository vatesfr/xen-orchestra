<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').type(`'number' | 'string'`).str().required().preset(2).widget(),
      prop('color')
        .type('CounterColor')
        .required()
        .enum('primary', 'secondary', 'success', 'warning', 'danger', 'disabled')
        .preset('primary')
        .widget(),
      prop('size').type('CounterSize').enum('small', 'medium').widget(),
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
