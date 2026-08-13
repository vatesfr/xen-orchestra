<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('info', 'warning', 'danger').preset('info').widget(),
      iconProp(),
      event('confirm').help('Emitted when the form is submitted (e.g. a submit button is clicked or Enter is pressed)'),
      event('dismiss').help(
        'When a listener is present, the dismiss button is displayed. Also emitted on Escape or backdrop click'
      ),
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
      setting('showDemoButton').widget(boolean()).preset(true),
    ]"
  >
    <UiModal class="story" v-bind="properties">
      <template #title>{{ settings.titleSlotContent }}</template>
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showDemoButton" #buttons>
        <VtsOverlayConfirmButton>Confirm</VtsOverlayConfirmButton>
      </template>
    </UiModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, event, slot, setting } from '@/libs/story/story-param'
import { text, boolean } from '@/libs/story/story-widget'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
