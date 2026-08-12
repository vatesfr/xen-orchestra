<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      event('click').help(
        'When a listener is present, the button is of type \'button\' and emits this event. Otherwise it is of type \'submit\' and submits the surrounding overlay form'
      ),
      slot().help('Button label'),
      setting('label').preset('Confirm').widget(text()),
    ]"
  >
    <VtsOverlayConfirmButton v-bind="properties">{{ settings.label }}</VtsOverlayConfirmButton>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
</script>
