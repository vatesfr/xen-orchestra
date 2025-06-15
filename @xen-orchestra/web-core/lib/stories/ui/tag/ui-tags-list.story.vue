<template>
  <ComponentStory :params>
    <UiTagsList>
      <UiTag accent="info" variant="primary">Tag</UiTag>
      <UiTag accent="success" variant="primary">Tag</UiTag>
      <UiTag accent="warning" variant="secondary">Tag</UiTag>
      <UiTag accent="danger" variant="secondary">Tag</UiTag>
    </UiTagsList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params } = useStory({
  slots: {
    default: { help: 'Meant to receive a list of UiTag components' },
  },
})
</script>
