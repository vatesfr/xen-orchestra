<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').required().enum('page', 'card', 'table', 'panel').preset('card').widget(),
      slot('title').help('Meant to receive title'),
      slot('text').help('Meant to receive text'),
      setting('title').preset('').widget(text()),
      setting('text').preset('').widget(text()),
    ]"
    :presets
  >
    <VtsLoadingHero v-bind="properties">
      <template v-if="settings.title" #title>{{ settings.title }}</template>
      <template v-if="settings.text" #text>{{ settings.text }}</template>
    </VtsLoadingHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'

const presets = {
  'with text': {
    settings: {
      title: 'Please wait',
      text: 'This is a loading text',
    },
  },
  'without text': {
    settings: {
      title: '',
      text: '',
    },
  },
}
</script>
