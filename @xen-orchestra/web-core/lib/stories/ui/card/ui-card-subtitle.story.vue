<template>
  <ComponentStory :params>
    <UiCardSubtitle>
      {{ settings.defaultSlotContent }}
      <template #info>{{ settings.infoSlotContent }}</template>
    </UiCardSubtitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { text } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, settings } = useStory({
  slots: {
    default: {},
    info: { help: 'Meant to receive an info text' },
  },
  settings: {
    defaultSlotContent: {
      preset: 'Subtitle',
      widget: text(),
    },
    infoSlotContent: {
      preset: 'Info',
      widget: text(),
    },
  },
})
</script>
