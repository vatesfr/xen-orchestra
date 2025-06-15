<template>
  <ComponentStory :params>
    <UiBadge v-bind="bindings">{{ settings.label }}</UiBadge>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiBadge from '@/components/ui/UiBadge.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    default: { help: 'This is the default slot' },
  },
  settings: {
    label: {
      preset: '65%',
    },
  },
})
</script>
