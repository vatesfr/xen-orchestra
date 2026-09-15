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
      <UiPanelCard>
        <div>Card content</div>
      </UiPanelCard>
    </UiPanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { boolean, text } from '@/libs/story/story-widget.ts'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
</script>
