<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      model().type('string').preset(''),
      prop('accent').enum('brand', 'warning', 'danger').required().preset('brand').widget(),
      prop('disabled').bool().widget(),
      prop('href').str().widget(),
      iconProp(),
      prop('max-characters').num().help('When used, it will display the character count under the input').widget(),
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
      <template v-if="settings.characterLimit" #character-limit>
        <UiCharacterLimit :count="properties.modelValue.length" :max="200" />
      </template>
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiTextarea>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
</script>
