<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('value').type(`'number' | 'string'`).str().required().preset(2).widget(),
      prop('accent')
        .required()
        .enum('brand', 'neutral', 'success', 'warning', 'danger', 'muted')
        .preset('brand')
        .widget(),
      prop('size').enum('small', 'medium').required().preset('small').widget(),
      prop('variant').enum('primary', 'secondary').required().preset('primary').widget(),
    ]"
  >
    <VtsCounter v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
</script>
