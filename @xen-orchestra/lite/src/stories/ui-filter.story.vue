<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      event('edit'),
      event('remove'),
      slot(),
      setting('label').widget(text()).preset('Some filter'),
    ]"
  >
    <UiFilter v-bind="properties">{{ settings.label }}</UiFilter>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import { event, setting, slot } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
</script>

<style lang="postcss" scoped></style>
