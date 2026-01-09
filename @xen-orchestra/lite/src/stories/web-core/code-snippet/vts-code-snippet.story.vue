<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('content').type('string | number').preset('649bc4d6-1f7b-dc00-58f8-ee8a6d4f28f4').widget(),
      prop('copy').help('Enable copy button').type('boolean').preset(true).widget(),
      slot().help('Meant to receive more complex content than just text or number'),
      slot('addons').help('Meant to receive addons like copy button etc.'),
    ]"
  >
    <VtsCodeSnippet v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
</script>
