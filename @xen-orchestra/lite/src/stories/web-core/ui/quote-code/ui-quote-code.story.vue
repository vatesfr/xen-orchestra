<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('code').preset(`[Code error here]`).type('string').widget(),
      prop('accent').preset('brand').enum('brand', 'error').widget(),
      prop('size').enum('small', 'medium').required().preset('small').widget(),
      slot().help('Meant to display the label'),
      slot('actions').help('Meant to receive UiButton or ButtonIcon (or other) components that will trigger actions'),
      setting('default').preset('Label').widget(),
      setting('showDemoButtons').widget(boolean()),
    ]"
  >
    <UiQuoteCode v-bind="properties">
      {{ settings.default }}

      <template v-if="settings.showDemoButtons" #actions>
        <VtsCopyButton :value="properties.code" />
      </template>
    </UiQuoteCode>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiQuoteCode from '@core/components/ui/quoteCode/UiQuoteCode.vue'
</script>
