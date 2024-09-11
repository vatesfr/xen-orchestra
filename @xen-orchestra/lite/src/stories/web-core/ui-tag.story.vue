<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('color')
        .type('TagColor')
        .required()
        .preset('primary')
        .enum('primary', 'secondary', 'success', 'warning', 'danger', 'disabled')
        .widget(),
      prop('light').bool().widget(),
      slot(),
      setting('slot').preset('Label').widget(),
    ]"
  >
    <UiTag v-bind="properties">{{ settings.slot }}</UiTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import UiTag from '@core/components/UiTag.vue'
</script>
