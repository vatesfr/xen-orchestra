<template>
  <ComponentStory :params>
    <VtsObjectNotFoundHero v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import type { StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    id: {
      preset: '123-456-789',
      required: true,
    },
    type: {
      preset: 'card' as StateHeroType,
      type: 'StateHeroType',
      required: true,
      widget: choice('page', 'card', 'table', 'panel'),
    },
  },
})
</script>
