<template>
  <ComponentStory :params>
    <VtsTreeList>
      <VtsTreeItemError>{{ settings.slotContent }}</VtsTreeItemError>
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, settings } = useStory({
  slots: {
    default: {},
  },
  settings: {
    slotContent: {
      help: 'Content for default slot',
      preset: "Error, can't collect data",
    },
  },
})
</script>
