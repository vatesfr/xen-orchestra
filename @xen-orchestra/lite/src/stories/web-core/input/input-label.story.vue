<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('status').enum('normal', 'warning', 'danger').required().preset('normal').widget(),
      prop('required').bool().widget(),
      prop('href').str().widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('Slot content'),
      iconProp(),
    ]"
  >
    <InputLabel v-bind="properties">{{ settings.defaultSlot }}</InputLabel>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import InputLabel from '@core/components/input/InputLabel.vue'
</script>
