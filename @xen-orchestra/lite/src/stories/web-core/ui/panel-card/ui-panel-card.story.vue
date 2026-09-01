<template>
  <ComponentStory :params="[slot()]">
    <UiPanelCard>
      <div class="content">Content 1</div>
      <div class="content">Content 2</div>
      <div class="content">Content 3</div>
    </UiPanelCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param.ts'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
</script>

<style lang="postcss" scoped>
.content {
  padding: 1rem;
  background-color: var(--color-neutral-background-secondary);
}
</style>
