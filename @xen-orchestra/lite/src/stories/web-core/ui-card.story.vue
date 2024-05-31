<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('direction').preset('column').enum('column', 'row').required().widget(),
      prop('padding').bool().preset(true).required().widget(),
    ]"
  >
    <UiCard v-bind="properties"
      ><UiTag>Content</UiTag><UiTag>Content</UiTag><UiSeparator /><UiTag>Content</UiTag></UiCard
    >
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCard from '@core/components/UiCard.vue'
import UiSeparator from '@core/components/UiSeparator.vue'
import UiTag from '@core/components/UiTag.vue'
</script>
