<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').type('string').preset('Label').widget(),
      prop('value').type('number').preset(0).widget(),
      prop('unit').type('string').preset('GB').widget(),
      prop('size').type('string').enum('small', 'medium').preset('small').widget(),
    ]"
    :presets="presets"
  >
    <CardNumbers v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import CardNumbers from '@core/components/CardNumbers.vue'
</script>
