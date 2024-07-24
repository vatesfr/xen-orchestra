<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('items').required().preset(items), prop('title').preset(title)]"
  >
    <LegendGroup v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import LegendGroup, { type LegendGroupProps } from '@core/components/legend/LegendGroup.vue'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const items: LegendGroupProps['items'] = [
  {
    label: 'First segment',
    color: 'primary',
    value: 42,
    unit: '%',
  },
  {
    label: 'Second segment',
    color: 'secondary',
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
</script>
