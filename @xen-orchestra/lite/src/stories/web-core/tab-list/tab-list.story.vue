<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().widget().preset('Tabs'),
      prop('disabled').bool().widget(),
      slot().help('Contains <RouterTab> or <UiTabItem>'),
    ]"
  >
    <TabList v-bind="properties">
      <UiTabItem>Foo</UiTabItem>
      <UiTabItem>Bar</UiTabItem>
      <UiTabItem>Baz</UiTabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
</script>
