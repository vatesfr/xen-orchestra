<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('accent').required().enum('info', 'success', 'warning', 'danger').preset('info').widget(),
      prop('disabled').bool().widget(),
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
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param'
import UiChip from '@core/components/ui/chip/UiChip.vue'
</script>
