<template>
  <ComponentStory :params>
    <VtsConnectionStatus v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsConnectionStatus, { type ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    status: {
      preset: ref<ConnectionStatus>('connected'),
      type: 'ConnectionStatus',
      required: true,
      widget: choice('connected', 'disconnected', 'partially-connected', 'disconnected-from-physical-device'),
    },
  },
})
</script>
