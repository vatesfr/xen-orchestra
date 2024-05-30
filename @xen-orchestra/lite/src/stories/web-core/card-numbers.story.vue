<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().required().preset('Label').widget(),
      prop('value').num().required().preset(0).widget(),
      prop('size').str().required().enum('small', 'medium').preset('small').widget(),
      prop('unit').str().preset('GB').widget(),
      prop('max').num().widget(),
    ]"
  >
    <CardNumbers v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import CardNumbers from '@core/components/CardNumbers.vue'
</script>
