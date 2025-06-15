<template>
  <ComponentStory :params>
    <BasicModalLayout v-bind="bindings">
      {{ settings.slotContent }}
    </BasicModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import BasicModalLayout from '@/components/ui/modals/layouts/BasicModalLayout.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings, settings } = useStory({
  slots: {
    default: { help: 'Default slot content' },
  },
  settings: {
    slotContent: { preset: 'Here is a basic modal...' },
  },
})
</script>
