<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('status').enum('normal', 'warning', 'danger').required().preset('normal').widget(),
      prop('required').bool().widget(),
      prop('href').str().widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('Some label'),
      iconProp(),
    ]"
  >
    <InputTextArea v-bind="properties">{{ settings.defaultSlot }}</InputTextArea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import InputTextArea from '@core/components/input/InputTextArea.vue'
</script>
