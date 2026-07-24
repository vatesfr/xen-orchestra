<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').str().widget().preset('Drawer Title'),
      event('confirm').help('Emitted when the form is submitted (e.g. a submit button is clicked or Enter is pressed)'),
      event('dismiss').help('Emitted when the dismiss button or backdrop is clicked, or Escape is pressed'),
      slot('title').help('Overrides the title prop'),
      slot('content').help('Main content area'),
      slot('buttons').help('Footer buttons area'),
      setting('contentSlotContent')
        .preset('This is the drawer content.')
        .widget(text())
        .help('Content for content slot'),
      setting('showButtons').widget(boolean()).preset(true),
    ]"
  >
    <UiDrawer class="story" v-bind="properties">
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showButtons" #buttons>
        <VtsOverlayConfirmButton>Confirm</VtsOverlayConfirmButton>
      </template>
    </UiDrawer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;

  :deep(.drawer) {
    min-height: 100%;
  }
}
</style>
