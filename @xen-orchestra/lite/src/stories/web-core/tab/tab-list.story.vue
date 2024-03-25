<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('disabled').bool().widget(), slot().help('Contains <RouterTab> or <TabItem>')]"
  >
    <TabList v-bind="properties">
      <TabItem>Foo</TabItem>
      <TabItem>Bar</TabItem>
      <TabItem>Baz</TabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
</script>
