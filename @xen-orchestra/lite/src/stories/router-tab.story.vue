<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('to').required().type('RouteLocationRaw').preset({ name: 'home' }),
      prop('disabled').bool().widget(),
      slot(),
      setting('label').widget(text()).preset('Foobar'),
    ]"
  >
    <UiTabBar>
      <RouterTab v-bind="properties">{{ settings.label }}</RouterTab>
    </UiTabBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import RouterTab from "@/components/RouterTab.vue";
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiTabBar from "@/components/ui/UiTabBar.vue";
import { prop, setting, slot } from "@/libs/story/story-param.js";
import { text } from "@/libs/story/story-widget.js";
</script>

<style lang="postcss" scoped></style>
