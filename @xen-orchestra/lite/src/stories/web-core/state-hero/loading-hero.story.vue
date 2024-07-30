<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').required().enum('page', 'card').preset('card').widget(),
      prop('disabled').bool().widget(),
      slot(),
      setting('slotContent').preset('Content to show when loader is disabled').widget(),
    ]"
  >
    <LoadingHero v-bind="properties">
      {{ settings.slotContent }}
    </LoadingHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
</script>
