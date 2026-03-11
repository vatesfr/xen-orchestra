<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('items').required().preset(items), prop('title').preset(title)]"
  >
    <VtsLegendGroup v-bind="properties" @open-modal="openLegendModal()" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend-group/VtsLegendGroup.vue'
import { useModal } from '@core/packages/modal/use-modal'

const openLegendModal = useModal({
  component: import('@core/components/modal/VtsModal.vue'),
  props: {
    accent: 'info',
    icon: 'status:info-picto',
    dismissible: true,
    title: 'legend modal',
    content: 'this is an modal',
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
    modalInfo: true,
  },
]

const title: LegendGroupProps['title'] = {
  label: 'Legend Title',
  icon: 'fa:info-circle',
}
</script>
