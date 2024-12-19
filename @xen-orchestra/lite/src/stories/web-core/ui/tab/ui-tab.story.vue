<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('disabled').bool().widget().ctx(),
      prop('selected').bool().widget(),
      prop('tag').str().default('span'),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
      setting('counter').widget(text()),
    ]"
  >
    <UiTabList>
      <UiTab v-bind="properties">
        {{ settings.label }}
        <UiCounter v-if="settings.counter" :value="settings.counter" accent="info" variant="primary" size="small" />
      </UiTab>
    </UiTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTab from '@core/components/ui/tab/UiTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'
</script>
