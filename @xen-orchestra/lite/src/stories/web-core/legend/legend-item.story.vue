<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('color')
        .type('LegendColor')
        .required()
        .preset('primary')
        .enum('primary', 'secondary', 'success', 'warning', 'danger', 'disabled')
        .widget(),
      prop('value').num().widget().preset(4),
      prop('unit').str().preset('GB').widget(),
      prop('tooltip').str().widget(),
      slot(),
      setting('slot').preset('Legend label').widget(text()),
    ]"
  >
    <LegendList>
      <LegendItem v-bind="properties">{{ settings.slot }}</LegendItem>
    </LegendList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import LegendItem from '@core/components/legend/LegendItem.vue'
import LegendList from '@core/components/legend/LegendList.vue'
</script>
