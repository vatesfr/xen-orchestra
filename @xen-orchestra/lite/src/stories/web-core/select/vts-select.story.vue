<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('options').required().arr('FormOption<TEntry, TValue>').widget().preset(options),
      prop('selectedLabel').str().widget(),
      prop('required').bool().widget(),
      prop('placeholder').str().widget().preset('Choose colors'),
      prop('searchPlaceholder').str().widget().preset('Search colors'),
      prop('loading').bool().widget(),
      model('search'),
      slot(),
    ]"
  >
    <VtsSelect v-bind="properties" v-model:search="searchTerm" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop, slot } from '@/libs/story/story-param.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormOptions } from '@core/packages/form-select'
import { upperFirst } from 'lodash-es'

const colors = ['blue', 'yellow', 'red', 'green', 'orange', 'purple', 'white', 'grey', 'black']

const { options, searchTerm } = useFormOptions(colors, {
  getValue: color => color,
  getLabel: color => `${upperFirst(color)} color`,
  getDisabled: color => color === 'blue' || color === 'orange' || color === 'black',
  multiple: true,
})
</script>
