<template>
  <ComponentStory :params>
    <VtsEnabledState v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    enabled: {
      preset: true,
      required: true,
    },
  },
})
</script>
