<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('to').required().type('RouteLocationRaw').preset({ name: 'home' }),
      prop('disabled').bool().widget().ctx(),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
    ]"
  >
    <VtsTabList>
      <RouterTab v-bind="properties">{{ settings.label }}</RouterTab>
    </VtsTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import RouterTab from '@/components/RouterTab.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
</script>
