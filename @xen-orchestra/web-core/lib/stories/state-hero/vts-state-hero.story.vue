<template>
  <ComponentStory :params>
    <VtsStateHero v-bind="bindings">
      {{ settings.defaultSlot }}
    </VtsStateHero>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroImage, type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    type: {
      preset: 'card' as StateHeroType,
      type: 'StateHeroType',
      required: true,
      widget: choice('page', 'card', 'table', 'panel'),
    },
    busy: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    image: {
      preset: ref<StateHeroImage>(),
      type: 'StateHeroImage',
      widget: choice(
        'no-result',
        'under-construction',
        'no-data',
        'no-selection',
        'error',
        'not-found',
        'offline',
        'all-good',
        'all-done'
      ),
    },
  },
  slots: {
    default: {},
  },
  settings: {
    defaultSlot: { preset: 'Some text' },
  },
})
</script>
