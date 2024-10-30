<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('busy').bool().widget(),
      prop('disabled').bool().widget().ctx(),
      slot(),
      setting('defaultSlotContent').preset('Label').widget(text()).help('Content for default slot'),
    ]"
  >
    <UiToggle v-bind="properties">{{ settings.defaultSlotContent }}</UiToggle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
</script>
