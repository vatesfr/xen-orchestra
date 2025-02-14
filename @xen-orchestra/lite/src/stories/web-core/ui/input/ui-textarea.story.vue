<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      model().type('string').preset(''),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('disabled').bool().widget(),
      prop('href').str().widget(),
      iconProp(),
      prop('placeholder').str().widget(),
      prop('required').bool().widget(),
      slot(),
      slot('character-limit').help('Meant to receive a UiCharacterLimit component.'),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Some label'),
      setting('characterLimit').widget(boolean()),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <UiTextarea v-bind="properties">
      {{ settings.defaultSlot }}
      <template v-if="settings.characterLimit" #character-limit>
        <UiCharacterLimit :count="properties.modelValue.length" :max="200" />
      </template>
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiTextarea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot, model } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
</script>
