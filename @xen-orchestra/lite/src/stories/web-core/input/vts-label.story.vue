<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('required').bool().widget(),
      prop('href').str().widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('Slot content'),
      iconProp(),
    ]"
  >
    <VtsLabel v-bind="properties">{{ settings.defaultSlot }}</VtsLabel>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsLabel from '@core/components/input/VtsLabel.vue'
</script>
