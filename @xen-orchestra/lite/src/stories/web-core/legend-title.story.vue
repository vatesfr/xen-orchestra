<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[prop('title').type('string').required().widget(), prop('tooltip').type('string').widget()]"
  >
    <LegendTitle v-bind="properties">{{ settings.slot }}</LegendTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import LegendTitle from '@core/components/LegendTitle.vue'
</script>
