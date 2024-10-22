<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'success', 'warning', 'danger').preset('brand').widget(),
      prop('disabled').bool().widget(),
      slot(),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <UiCheckbox v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiCheckbox>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
</script>
