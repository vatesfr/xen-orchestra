<template>
  <ComponentStory :params :presets>
    <VtsLoadingHero v-bind="bindings">
      <template v-if="settings.title" #title>{{ settings.title }}</template>
      <template v-if="settings.text" #text>{{ settings.text }}</template>
    </VtsLoadingHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import type { StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings, settings } = useStory({
  props: {
    type: {
      preset: 'card' as StateHeroType,
      type: 'StateHeroType',
      required: true,
      widget: choice('page', 'card', 'table', 'panel'),
    },
  },
  slots: {
    title: { help: 'Meant to receive a title' },
    text: { help: 'Meant to receive an additional text' },
  },
  settings: {
    title: {
      preset: 'This is a title',
    },
    text: {
      preset: 'This is some text',
    },
  },
})

const presets: Record<string, () => void> = {
  'with text': () => {
    settings.title = 'Please wait'
    settings.text = 'This is a loading text'
  },
  'without text': () => {
    settings.title = ''
    settings.text = ''
  },
}
</script>
