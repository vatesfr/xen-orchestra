<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().required().preset('Label').widget(),
      prop('size').str().required().enum('small', 'medium').preset('small').widget(),
      prop('value').num().preset(0).widget(),
      prop('unit').str().preset('GB').widget(),
      prop('max').num().widget(),
    ]"
  >
    <UiCardNumbers v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
</script>
