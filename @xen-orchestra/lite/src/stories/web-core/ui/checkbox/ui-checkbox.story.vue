<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').type('CheckboxAccent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('value').str().help('Used when the model is an array'),
      prop('disabled').bool().widget(),
      slot(),
      slot('info'),
      slot('message'),
      setting('defaultSlot').widget(text()).preset('Label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
      setting('message').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
      model().type('boolean | undefined | string[]').preset(undefined).help('undefined means partly checked'),
    ]"
  >
    <UiCheckbox v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
      <template v-if="settings.message" #message>{{ settings.message }}</template>
    </UiCheckbox>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
</script>
