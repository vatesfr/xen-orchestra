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
    <VtsTabList>
      <VtsTabItem v-bind="properties">
        {{ settings.label }}
        <VtsCounter v-if="settings.counter" :value="settings.counter" accent="brand" variant="primary" size="small" />
      </VtsTabItem>
    </VtsTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
</script>
