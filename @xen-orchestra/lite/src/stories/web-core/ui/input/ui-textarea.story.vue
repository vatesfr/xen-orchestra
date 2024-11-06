<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      model().type('string').preset(''),
      prop('accent').enum('info', 'warning', 'danger').required().preset('info').widget(),
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
    <UiTextarea v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiTextarea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot, model } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiTextarea from '@core/components/ui/input/UiTextarea.vue'
</script>
