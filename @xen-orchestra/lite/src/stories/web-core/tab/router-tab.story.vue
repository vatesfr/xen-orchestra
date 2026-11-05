<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('to').required().type('RouteLocationRaw').preset({ name: '/' }),
      prop('disabled').bool().widget().ctx(),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
    ]"
  >
    <TabList>
      <RouterTab v-bind="properties">{{ settings.label }}</RouterTab>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import RouterTab from '@/components/RouterTab.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import TabList from '@core/components/tab-list/TabList.vue'
</script>
