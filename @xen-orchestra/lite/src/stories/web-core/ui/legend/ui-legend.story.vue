<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('LegendAccent')
        .required()
        .preset('info')
        .enum('neutral', 'info', 'success', 'warning', 'danger', 'muted')
        .widget(),
      prop('value').num().widget().preset(4),
      prop('unit').str().preset('GB').widget(),
      prop('tooltip').str().widget(),
      slot(),
      setting('slot').preset('Legend label').widget(text()),
    ]"
  >
    <VtsLegendList>
      <UiLegend v-bind="properties">{{ settings.slot }}</UiLegend>
    </VtsLegendList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
</script>
