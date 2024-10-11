<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('disabled').bool().widget(), slot().help('Contains <RouterTab> or <VtsTabItem>')]"
  >
    <VtsTabList v-bind="properties">
      <VtsTabItem>Foo</VtsTabItem>
      <VtsTabItem>Bar</VtsTabItem>
      <VtsTabItem>Baz</VtsTabItem>
    </VtsTabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
</script>
