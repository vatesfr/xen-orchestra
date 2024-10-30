<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('info', 'success', 'warning', 'danger').required().preset('info').widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('message'),
    ]"
  >
    <VtsInfo v-bind="properties">{{ settings.defaultSlot }}</VtsInfo>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsInfo from '@core/components/info/VtsInfo.vue'
</script>
