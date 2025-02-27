<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      model().type('string | number').preset(''),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('id').str().widget(),
      prop('type').enum('text', 'number', 'password').preset('text').widget(),
      prop('disabled').bool().widget(),
      prop('clearable').bool().widget(),
      prop('href').str().widget(),
      prop('label').str().widget(),
      prop('info').str().widget(),
      iconProp(),
      iconProp('labelIcon'),
      prop('placeholder').str().widget(),
      prop('required').bool().widget(),
      slot(),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Some label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <UiInput placeholder="Enter your search" v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiInput>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiInput from '@core/components/ui/input/UiInput.vue'
</script>
