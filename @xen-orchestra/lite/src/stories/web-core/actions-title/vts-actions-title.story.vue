<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[slot(), setting('defaultSlot').widget(text()).preset('message')]"
  >
    <VtsActionsTitle v-bind="properties">{{ settings.defaultSlot }}</VtsActionsTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsActionsTitle from '@core/components/actions-title/VtsActionsTitle.vue'
</script>
