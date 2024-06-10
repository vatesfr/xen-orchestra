<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('color')
        .type('LegendColor')
        .required()
        .preset('default')
        .enum('default', 'success', 'warning', 'error', 'disabled', 'dark-blue')
        .widget(),
      prop('value').num().widget().preset(4),
      prop('unit').str().preset('GB').widget(),
      prop('tooltip').str().widget(),
      slot(),
      setting('slot').preset('Legend label').widget(text()),
    ]"
  >
    <UiLegend v-bind="properties">{{ settings.slot }}</UiLegend>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiLegend from '@core/components/UiLegend.vue'
</script>
