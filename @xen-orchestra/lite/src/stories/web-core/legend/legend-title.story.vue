<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('icon-tooltip').type('string').widget(),
      slot(),
      setting('defaultSlotContent').preset('Legend title').widget(text()),
    ]"
  >
    <LegendTitle v-bind="properties">{{ settings.defaultSlotContent }}</LegendTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp, slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import LegendTitle from '@core/components/LegendTitle.vue'
</script>
