<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').type('string').default('Label').widget(),
      prop('value').type('number').default(0).widget(),
      prop('unit').type('string').default('GB').widget(),
      prop('size').type('string').enum('small', 'medium').default('small').widget(),
    ]"
    :presets="presets"
  >
    <CardNumbers v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import CardNumbers from '@core/components/CardNumbers.vue'

const presets = {
  'Default Values': {
    props: {
      label: 'Label',
      value: 0,
      unit: 'GB',
      size: 'small',
    },
  },
}
</script>
