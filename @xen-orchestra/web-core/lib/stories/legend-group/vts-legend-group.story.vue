<template>
  <ComponentStory :params>
    <VtsLegendGroup v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend-group/VtsLegendGroup.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    accent: 'info',
    value: 42,
    unit: '%',
  },
  {
    label: 'Second segment',
    accent: 'neutral',
    value: 58,
    unit: '%',
    tooltip: 'This is another tooltip',
  },
]

const title: LegendGroupProps['title'] = {
  label: 'Legend Title',
  icon: faInfoCircle,
  iconTooltip: 'This is a tooltip',
}

const { params, bindings } = useStory({
  props: {
    items: {
      preset: items,
      required: true,
    },
    title: {
      preset: title,
    },
  },
})
</script>
