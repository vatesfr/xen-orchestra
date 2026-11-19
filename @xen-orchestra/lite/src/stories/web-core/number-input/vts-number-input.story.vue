<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('number | undefined').preset(2),
      prop('label').str().required().preset('Quantity').widget(),
      prop('info').str().widget(),
      prop('warning').type('InputWrapperMessage').widget(object()),
      prop('error').type('InputWrapperMessage').widget(object()),
      prop('required').bool().widget(),
      event('blur'),
    ]"
  >
    <VtsNumberInput v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, model, prop } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'
</script>
