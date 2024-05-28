<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').type('number').widget().preset(4).required(),
      prop('state')
        .type('string')
        .preset('default')
        .enum('default', 'success', 'warning', 'error', 'disabled', 'dark-blue')
        .widget(),
      prop('label').type('string').preset('Legend label').widget(),
      prop('unit').type('string').preset('GB').widget(),
      prop('tooltip').type('string').widget(),
    ]"
  >
    <UiLegend v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiLegend from '@core/components/UiLegend.vue'
</script>
