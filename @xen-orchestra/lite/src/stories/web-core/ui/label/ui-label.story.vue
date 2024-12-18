<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('neutral', 'warning', 'danger').required().preset('neutral').widget(),
      prop('for').str().widget(),
      prop('required').bool().widget(),
      prop('href').str().widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('Slot content'),
      iconProp(),
    ]"
  >
    <UiLabel v-bind="properties">{{ settings.defaultSlot }}</UiLabel>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
</script>
