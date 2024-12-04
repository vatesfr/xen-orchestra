<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('disabled').bool().widget(), slot().help('Contains <RouterTab> or <UiTab>')]"
  >
    <UiTabList v-bind="properties">
      <UiTab>Foo</UiTab>
      <UiTab>Bar</UiTab>
      <UiTab>Baz</UiTab>
    </UiTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiTab from '@core/components/ui/tab/UiTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'
</script>
