<template>
  <ComponentStory :params>
    <UiPanel v-bind="bindings">
      {{ settings.defaultSlot }}
      <template #header>{{ settings.headerSlot }}</template>
    </UiPanel>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    error: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {},
    header: { help: 'Meant to receive UiButton or other information' },
  },
  settings: {
    defaultSlot: {
      preset: 'Default slot content...',
    },
    headerSlot: {
      preset: 'Some header text...',
    },
  },
})
</script>
