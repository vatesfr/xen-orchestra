<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp(),
      prop('title').type('string').required().preset('Card title').widget(),
      prop('titleLink').type('string').required().preset('/hello').widget(),
      prop('titleLinkLabel').type('string').widget(),
      prop('segments').type('array').required().preset(segments).widget(),
      prop('legends').type('array').required().preset(legends).widget(),
      prop('totalLabel').type('string').widget(),
      prop('totalValue').type('number').required().preset(80).widget(),
    ]"
  >
    <PoolStatusItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, iconProp } from '@/libs/story/story-param'
import PoolStatusItem from '@core/components/PoolStatusItem.vue'

const segments = [
  { value: 16, color: 'success' },
  { value: 22, color: 'warning' },
  { value: 35, color: 'error' },
  { value: 12, color: 'unknown' },
]

const legends = [
  { color: 'success', value: 16, unit: 'GB', label: 'Label' },
  { color: 'warning', value: 22, unit: 'GB', label: 'Label' },
  { color: 'error', value: 35, unit: 'GB', label: 'Label' },
  { color: 'unknown', value: 12, unit: 'GB', tooltip: 'Tooltip for unknown', label: 'Label' },
]
</script>
