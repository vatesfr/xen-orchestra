<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('variant').required().enum('primary', 'secondary', 'tertiary').preset('primary').widget(),
      slot().help('Button label'),
      setting('label').preset('Click me').widget(text()),
    ]"
  >
    <VtsOverlayButton v-bind="properties">{{ settings.label }}</VtsOverlayButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
</script>
