<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('copy-element').type('string').preset('hello world').required().widget()]"
  >
    <UiCopyButton v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCopyButton from '@core/components/ui/copy-button/UiCopyButton.vue'
</script>
