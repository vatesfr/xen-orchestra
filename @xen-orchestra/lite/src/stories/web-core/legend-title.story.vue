<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[prop('title').type('string').required().widget(), prop('hasIcon').bool().widget().default(false)]"
  >
    <LegendTitle v-bind="properties">{{ settings.defaultSlot }}</LegendTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import LegendTitle from '@core/components/LegendTitle.vue'
</script>
