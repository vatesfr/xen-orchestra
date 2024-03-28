<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      colorProp(),
      prop('disabled').bool().widget().ctx(),
      event('edit'),
      event('remove'),
      slot(),
      setting('slot').preset('State: in progress').widget(),
    ]"
  >
    <UiChip v-bind="properties">{{ settings.slot }}</UiChip>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { colorProp, event, iconProp, prop, setting, slot } from '@/libs/story/story-param'
import UiChip from '@core/components/chip/UiChip.vue'
</script>
