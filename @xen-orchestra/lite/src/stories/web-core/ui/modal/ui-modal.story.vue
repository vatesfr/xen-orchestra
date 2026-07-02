<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('info', 'warning', 'danger').preset('info').widget(),
      iconProp(),
      prop('onDismiss').type('function').widget(),
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
      setting('showDemoButton').widget(boolean()).preset(true),
    ]"
  >
    <UiModal class="story" v-bind="properties">
      <template #title>{{ settings.titleSlotContent }}</template>
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showDemoButton" #buttons>
        <UiButton :accent="properties.accent === 'info' ? 'brand' : properties.accent" variant="primary" size="medium">
          Confirm
        </UiButton>
      </template>
    </UiModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, event, slot, setting } from '@/libs/story/story-param'
import { text, boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
