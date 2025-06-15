<template>
  <ComponentStory :params>
    <UiTitle>
      {{ settings.slotContent }}

      <template v-if="settings.showDemoButtons" #actions>
        <UiButton size="medium" variant="secondary" accent="brand">Label</UiButton>
        <UiButton size="medium" variant="secondary" accent="brand">Label</UiButton>
      </template>
    </UiTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { boolean } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, settings } = useStory({
  slots: {
    default: {
      help: 'Meant to display the title',
    },
    actions: {
      help: 'Meant to receive UiButton or ButtonIcon components that will trigger actions',
    },
  },
  settings: {
    slotContent: {
      preset: 'Label',
    },
    showDemoButtons: {
      preset: false,
      widget: boolean(),
    },
  },
})
</script>
