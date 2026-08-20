<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('items').required().preset(items), prop('title').preset(title)]"
  >
    <VtsLegendGroup v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend-group/VtsLegendGroup.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { open: openLegendModal } = useOverlay({
  component: () => import('@/stories/web-core/ui/legend/LegendInfoModal.vue'),
  events: {
    onClose: true,
  },
})

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    accent: 'info',
    value: 42,
    unit: '%',
  },
  {
    label: 'Second segment',
    accent: 'secondary',
    value: 58,
    unit: '%',
    onInfoClick: () => openLegendModal(),
  },
]

const title: LegendGroupProps['title'] = {
  label: 'Legend Title',
  icon: 'fa:info-circle',
  iconTooltip: 'This is a tooltip',
}
</script>
