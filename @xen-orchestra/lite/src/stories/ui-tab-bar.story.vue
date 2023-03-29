<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('disabled').bool().widget(),
      slot().help('Contains <RouterTab> or <UiTab>'),
    ]"
  >
    <UiTabBar v-bind="properties">
      <UiTab>Foo</UiTab>
      <UiTab>Bar</UiTab>
      <UiTab>Baz</UiTab>
    </UiTabBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiTab from "@/components/ui/UiTab.vue";
import UiTabBar from "@/components/ui/UiTabBar.vue";
import { prop, slot } from "@/libs/story/story-param.js";
</script>

<style lang="postcss" scoped></style>
