<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('horizontal').bool().widget()]">
    <UiCard v-bind="properties">
      <div class="content">Content 1</div>
      <div class="content">Content 2</div>
      <div class="content">Content 3</div>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style lang="postcss" scoped>
.content {
  padding: 1rem;
  background-color: var(--color-neutral-background-secondary);
}
</style>
