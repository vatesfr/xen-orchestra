<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('selected').bool().widget(),
      prop('disabled').bool().widget().ctx(),
      slot(),
      setting('defaultSlotContent').preset('Dropdown title').widget(text()).help('Content for default slot'),
    ]"
  >
    <UiDropdownButton v-bind="properties">{{ settings.defaultSlotContent }}</UiDropdownButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
</script>
