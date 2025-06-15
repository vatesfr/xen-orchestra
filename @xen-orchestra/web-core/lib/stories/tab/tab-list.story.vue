<template>
  <ComponentStory :params>
    <TabList v-bind="bindings">
      <TabItem>Foo</TabItem>
      <TabItem>Bar</TabItem>
      <TabItem>Baz</TabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    disabled: {
      preset: ref(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Contains <RouterTab> or <TabItem>' },
  },
})
</script>
