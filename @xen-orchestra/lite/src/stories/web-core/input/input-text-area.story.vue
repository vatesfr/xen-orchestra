<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('disabled').bool().widget(),
      prop('href').str().widget(),
      iconProp(),
      prop('placeholder').str().widget(),
      prop('required').bool().widget(),
      slot(),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Some label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <InputTextArea v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </InputTextArea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import InputTextArea from '@core/components/input/InputTextArea.vue'
</script>
