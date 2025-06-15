<template>
  <ComponentStory :params>
    <UiCard v-bind="bindings">
      <div class="content">Content 1</div>
      <div class="content">Content 2</div>
      <div class="content">Content 3</div>
    </UiCard>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    horizontal: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {},
  },
})
</script>

<style lang="postcss" scoped>
.content {
  padding: 1rem;
  background-color: var(--color-neutral-background-secondary);
}
</style>
