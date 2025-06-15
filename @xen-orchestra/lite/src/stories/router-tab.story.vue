<template>
  <ComponentStory :params>
    <TabList>
      <RouterTab v-bind="bindings">{{ settings.slotContent }}</RouterTab>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import RouterTab from '@/components/RouterTab.vue'
import TabList from '@core/components/tab/TabList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    to: {
      preset: { name: 'home' },
      type: 'RouteLocationRaw',
      required: true,
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    slotContent: { preset: 'Foobar' },
  },
})
</script>
