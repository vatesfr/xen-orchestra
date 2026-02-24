<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('brand', 'warning', 'danger').widget(),
      slot().help('Meant to receive message of the banner'),
      slot('addons').help('Meant to receive addons like button etc.'),
      setting('defaultSlot').widget(text()).preset('Message of the banner'),
    ]"
  >
    <VtsBanner v-bind="properties">{{ settings.defaultSlot }}</VtsBanner>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
</script>
