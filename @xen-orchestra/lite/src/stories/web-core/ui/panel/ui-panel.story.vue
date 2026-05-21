<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('error').bool().widget().preset(false),
      slot(),
      slot('header').help('Optional panel header'),
      setting('showHeader').widget(boolean()).preset(true),
      setting('headerContent').widget(text()).preset('Panel header'),
    ]"
  >
    <UiPanel v-bind="properties">
      <template v-if="settings.showHeader" #header>{{ settings.headerContent }}</template>
      <UiCard>
        <div>Card content</div>
      </UiCard>
    </UiPanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean, text } from '@/libs/story/story-widget'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
</script>
