<template>
  <ComponentStory :params>
    <UiFilter v-bind="bindings">{{ settings.slotContent }}</UiFilter>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiFilter from '@/components/ui/UiFilter.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings, settings } = useStory({
  events: {
    edit: { help: 'Emitted when filter label is clicked' },
    remove: { help: 'Emitted when filter delete icon is clicked' },
  },
  slots: {
    default: { help: 'This is the default slot' },
  },
  settings: {
    slotContent: {
      preset: 'Some filter',
    },
  },
})
</script>
