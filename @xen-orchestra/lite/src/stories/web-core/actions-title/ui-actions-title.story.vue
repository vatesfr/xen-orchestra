<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[slot(), setting('defaultSlot').widget(text()).preset('message')]"
  >
    <UiActionsTitle v-bind="properties">{{ settings.defaultSlot }}</UiActionsTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
</script>
