<template>
  <ComponentStory :params>
    <UiActionsTitle v-bind="bindings">{{ settings.defaultSlot }}</UiActionsTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings, settings } = useStory({
  slots: {
    default: {},
  },
  settings: {
    defaultSlot: { preset: 'message' },
  },
})
</script>
