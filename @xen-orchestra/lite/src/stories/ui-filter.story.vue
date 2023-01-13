<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[event('edit').args({ id: 'string' }), event('remove')]"
  >
    <UiFilter v-bind="properties">Some filter</UiFilter>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import { event } from "@/libs/story/story-param";
</script>

<style lang="postcss" scoped></style>
