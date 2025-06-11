<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('code').preset(`{component: UiQuoteCode}`).type('string').widget(),
      prop('accent').preset('brand').enum('brand', 'error').widget(),
      slot('title'),
    ]"
  >
    <UiQuoteCode v-bind="properties">
      <template #title>
        <div>hello world</div>
      </template>
    </UiQuoteCode>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiQuoteCode from '@core/components/ui/quoteCode/UiQuoteCode.vue'
</script>
