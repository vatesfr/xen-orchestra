<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().widget().preset('label'),
      prop('value').type('string | string[]').required().preset('value'),
      prop('ellipsis').bool().help('Use to allow the ellipsis on value prop').widget(),
      prop('copyValue').type('string | string[]'),
      slot('value').help('Use a complex value'),
      slot('addons').help('Use addons to show an object between values'),
      slot('actions').help('Use actions to show an object at the end of the line. Acion overflow props.copyValue'),
    ]"
  >
    <UiLabelValue v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
</script>
