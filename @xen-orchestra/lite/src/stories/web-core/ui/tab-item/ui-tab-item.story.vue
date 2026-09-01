<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('disabled').bool().widget().ctx(),
      prop('active').bool().widget(),
      prop('tag').str().default('span'),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
      setting('counter').widget(text()),
    ]"
  >
    <TabList>
      <UiTabItem v-bind="properties">
        {{ settings.label }}
        <UiCounter v-if="settings.counter" :value="settings.counter" accent="info" variant="primary" size="small" />
      </UiTabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
</script>
