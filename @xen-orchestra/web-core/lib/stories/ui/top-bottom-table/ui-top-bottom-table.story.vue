<template>
  <ComponentStory :params>
    <UiTopBottomTable v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    selectedItems: {
      preset: ref(8),
      required: true,
    },
    totalItems: {
      preset: ref(25),
      required: true,
    },
  },
  events: {
    toggleSelectAll: { args: { value: 'boolean' } },
  },
})
</script>
