<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').type('string').required().preset('Title text').widget(),
      prop('tooltip').type('string').widget(),
      iconProp(),
    ]"
  >
    <LegendTitle v-bind="properties">{{ settings.slot }}</LegendTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp } from '@/libs/story/story-param'
import LegendTitle from '@core/components/LegendTitle.vue'
</script>
