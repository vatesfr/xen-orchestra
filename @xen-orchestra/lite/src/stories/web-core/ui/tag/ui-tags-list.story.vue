<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[slot().help('Meant to receive a list of UiTag components'), setting('slot').preset('Label').widget()]"
  >
    <UiTagsList>
      <UiTag accent="info" variant="primary">{{ settings.slot }}</UiTag>
      <UiTag accent="success" variant="primary">{{ settings.slot }}</UiTag>
      <UiTag accent="warning" variant="secondary">{{ settings.slot }}</UiTag>
      <UiTag accent="danger" variant="secondary">{{ settings.slot }}</UiTag>
    </UiTagsList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
</script>
