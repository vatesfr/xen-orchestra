<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('accent')
        .type('TagAccent')
        .required()
        .preset('info')
        .enum('info', 'neutral', 'success', 'warning', 'danger', 'muted')
        .widget(),
      prop('variant').type('TagVariant').required().preset('primary').enum('primary', 'secondary').widget(),
      slot(),
      setting('slot').preset('Label').widget(),
    ]"
  >
    <UiTag v-bind="properties">{{ settings.slot }}</UiTag>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import UiTag from '@core/components/ui/tag/UiTag.vue'
</script>
