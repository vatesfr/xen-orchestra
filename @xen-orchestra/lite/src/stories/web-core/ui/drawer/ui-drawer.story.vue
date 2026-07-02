<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').str().widget(),
      event('dismiss'),
      slot('title'),
      slot('content'),
      slot('buttons'),
      setting('titleSlotContent')
        .preset('Example content for title slot')
        .widget(text())
        .help('Content for title slot (leave empty to fall back to the title prop)'),
      setting('contentSlotContent')
        .preset('Example content for content slot')
        .widget(text())
        .help('Content for content slot'),
      setting('showDemoButton').widget(boolean()).preset(true),
    ]"
  >
    <UiDrawer class="story" v-bind="properties">
      <template v-if="settings.titleSlotContent" #title>{{ settings.titleSlotContent }}</template>
      <template #content>{{ settings.contentSlotContent }}</template>
      <template v-if="settings.showDemoButton" #buttons>
        <UiButton accent="brand" variant="primary" size="medium">Confirm</UiButton>
      </template>
    </UiDrawer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, slot, setting } from '@/libs/story/story-param'
import { text, boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
</script>

<style lang="postcss" scoped>
.story {
  position: relative;
  height: 100%;
}
</style>
