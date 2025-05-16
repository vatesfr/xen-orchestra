<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('value').type('string').preset('hello world').required().widget()]"
  >
    <VtsCopyButton v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
</script>
