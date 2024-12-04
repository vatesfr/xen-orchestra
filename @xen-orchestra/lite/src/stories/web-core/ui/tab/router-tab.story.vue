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
    <UiTabList>
      <RouterTab v-bind="properties">{{ settings.label }}</RouterTab>
    </UiTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import RouterTab from '@/components/RouterTab.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'
</script>
