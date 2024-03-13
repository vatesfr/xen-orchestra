<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').num().required().preset(2).widget(),
      prop('suffix').str().widget(),
      prop('color').type('CounterColor').enum('info', 'success', 'warning', 'error', 'danger', 'black').widget(),
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
