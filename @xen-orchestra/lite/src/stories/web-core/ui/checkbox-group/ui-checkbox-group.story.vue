<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('vertical').bool().widget(),
      prop('labels').required().preset(labels).widget(),
      slot(),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <UiCheckboxGroup v-bind="properties" :labels="labels">
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiCheckboxGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import { ref } from 'vue'

const labels = ref(['Label 1', 'Label 2', 'Label 3'])
</script>
