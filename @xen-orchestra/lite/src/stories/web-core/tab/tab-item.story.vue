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
      <TabItem v-bind="properties">
        {{ settings.label }}
        <VtsCounter v-if="settings.counter" :value="settings.counter" accent="brand" variant="primary" size="small" />
      </TabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
</script>
