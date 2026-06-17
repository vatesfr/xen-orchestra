<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('info', 'warning', 'danger').preset('info').widget(),
      iconProp(),
      prop('dismissible').bool().widget(),
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
    <VtsModal class="story" v-bind="properties">
      <template #title>{{ settings.titleSlotContent }}</template>
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showDemoButtons" #buttons>
        <VtsModalCancelButton>Cancel</VtsModalCancelButton>
        <VtsModalConfirmButton> Confirm </VtsModalConfirmButton>
      </template>
    </VtsModal>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, event, slot, setting } from '@/libs/story/story-param'
import { text, boolean } from '@/libs/story/story-widget'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
