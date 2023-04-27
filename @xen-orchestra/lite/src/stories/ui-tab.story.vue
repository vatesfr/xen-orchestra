<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('disabled').bool().widget(),
      prop('active').bool().widget(),
      prop('tag').str().default('span'),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
    ]"
  >
    <UiTabBar>
      <UiTab v-bind="properties">{{ settings.label }}</UiTab>
    </UiTabBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiTab from "@/components/ui/UiTab.vue";
import UiTabBar from "@/components/ui/UiTabBar.vue";
import { prop, setting, slot } from "@/libs/story/story-param.js";
import { text } from "@/libs/story/story-widget.js";
</script>

<style lang="postcss" scoped></style>
