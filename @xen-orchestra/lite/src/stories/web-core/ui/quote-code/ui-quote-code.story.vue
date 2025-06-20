<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('label').preset('Label').type('string').widget(),
      prop('accent').type('QuoteCodeAccent').enum('brand', 'danger').required().preset('brand').widget(),
      prop('size').type('QuoteCodeSize').enum('small', 'medium').required().preset('small').widget(),
      slot().help('Meant to display the code'),
      slot('actions').help('Meant to receive UiButton or ButtonIcon (or other) components that will trigger actions'),
      setting('default').preset('[Error code here]').widget(),
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
