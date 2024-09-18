<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('status').enum('info', 'success', 'warning', 'danger').required().preset('info').widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('message'),
    ]"
  >
    <UiInfo v-bind="properties">{{ settings.defaultSlot }}</UiInfo>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiInfo from '@core/components/info/UiInfo.vue'
</script>
