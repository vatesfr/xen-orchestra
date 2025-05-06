<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').required().enum('page', 'card', 'table', 'panel').preset('card').widget(),
      slot('title').help('Meant to receive title'),
      slot('text').help('Meant to receive text'),
      setting('title').preset('Please wait').widget(text()),
      setting('text').preset('This is a loading text').widget(text()),
    ]"
  >
    <VtsLoadingHero v-bind="properties">
      <template #title> {{ settings.title }}</template>
      <template #text> {{ settings.text }}</template>
    </VtsLoadingHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
</script>
