<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type(`'small' | 'large'`).enum('small', 'large').required().preset('large').widget(),
      prop('title').str().required().widget().preset('title'),
      prop('identifier').type(`'string' | 'number'`).required().widget().preset('aRandomId'),
      prop('content').str().widget().preset('content'),
      prop('disabled').bool().widget(),
      slot('content'),
    ]"
  >
    <UiAccordionItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiAccordionItem from '@core/components/ui/accordion-item/UiAccordionItem.vue'
</script>
