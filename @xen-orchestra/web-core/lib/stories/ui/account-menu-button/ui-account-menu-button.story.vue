<template>
  <ComponentStory :params>
    <UiAccountMenuButton v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    size: {
      preset: ref<'small' | 'medium'>('medium'),
      type: '"small" | "medium"',
      required: true,
      widget: choice('small', 'medium'),
    },
    selected: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
})
</script>
