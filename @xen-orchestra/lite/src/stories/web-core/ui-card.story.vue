<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('horizontal').bool().widget()]">
    <UiCard v-bind="properties"><UiTag>Content</UiTag><UiTag>Content</UiTag><UiTag>Content</UiTag></UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCard from '@core/components/UiCard.vue'
import UiTag from '@core/components/UiTag.vue'
</script>
