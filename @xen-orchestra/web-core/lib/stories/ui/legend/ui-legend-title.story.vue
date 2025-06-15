<template>
  <ComponentStory :params>
    <UiLegendTitle v-bind="bindings">{{ settings.slotContent }}</UiLegendTitle>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiLegendTitle from '@core/components/ui/legend-title/UiLegendTitle.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { bindings, params, settings } = useStory({
  props: {
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    iconTooltip: {
      preset: ref<string>(),
      type: 'string',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    slotContent: {
      preset: 'Legend title',
    },
  },
})
</script>
