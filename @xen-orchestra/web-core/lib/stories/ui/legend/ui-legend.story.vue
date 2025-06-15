<template>
  <ComponentStory :params>
    <VtsLegendList>
      <UiLegend v-bind="bindings">{{ settings.slotContent }}</UiLegend>
    </VtsLegendList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend, { type LegendItemAccent } from '@core/components/ui/legend/UiLegend.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    accent: {
      type: 'LegendItemAccent',
      widget: choice<LegendItemAccent>('neutral', 'info', 'success', 'warning', 'danger', 'muted'),
      required: true,
      preset: 'info' as LegendItemAccent,
    },
    value: {
      type: 'number',
      preset: ref<number>(),
    },
    unit: {
      preset: ref<string>(),
      type: 'string',
    },
    tooltip: {
      preset: ref<string>(),
      type: 'string',
    },
  },
  slots: {
    default: {},
  },
  settings: {
    slotContent: {
      preset: 'Legend label',
    },
  },
})
</script>
