<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('type').enum('modal', 'drawer').preset('modal').widget(),
      prop('accent').enum('info', 'warning', 'danger').preset('info').widget().help('Modal only'),
      iconProp().help('Modal only'),
      prop('dismissible').bool().widget().help('Modal only — drawers are always dismissible'),
      prop('onDismiss').type('function').widget(),
      prop('onConfirm').type('function').widget(),
      prop('current').bool().widget(),
      event('confirm'),
      event('dismiss'),
      slot('title'),
      slot('content'),
      slot('buttons'),
      setting('titleSlotContent')
        .preset('Example content for title slot')
        .widget(text())
        .help('Content for title slot'),
      setting('contentSlotContent')
        .preset('Example content for content slot')
        .widget(text())
        .help('Content for content slot'),
      setting('showDemoButtons').widget(boolean()),
    ]"
  >
    <VtsOverlay class="story" v-bind="properties">
      <template #title>{{ settings.titleSlotContent }}</template>
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showDemoButtons" #buttons>
        <VtsOverlayCancelButton>Cancel</VtsOverlayCancelButton>
        <VtsOverlayConfirmButton> Confirm </VtsOverlayConfirmButton>
      </template>
    </VtsOverlay>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, event, slot, setting } from '@/libs/story/story-param'
import { text, boolean } from '@/libs/story/story-widget'
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
