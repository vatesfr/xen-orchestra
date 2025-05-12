<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('options').required().arr('FormOption<TEntry, TValue>').widget().preset(options),
      prop('selectedLabel').str(),
      prop('required').bool().widget(),
      prop('placeholder').str().widget().preset('Choose colors'),
      prop('searchPlaceholder').str().widget().preset('Search colors'),
      prop('loading').bool().widget(),
      model('search'),
      slot(),
    ]"
  >
    <VtsSelect v-bind="properties" v-model:search="searchTerm" :selected-label />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop, slot } from '@/libs/story/story-param.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { upperFirst } from 'lodash-es'

const colors = ['blue', 'yellow', 'red', 'green', 'orange', 'purple', 'white', 'grey', 'black']

const { options, searchTerm, selectedLabel } = useFormSelect(colors, {
  properties: color => ({
    value: color,
    label: `${upperFirst(color)} color`,
    disabled: color === 'blue' || color === 'orange' || color === 'black',
  }),
  multiple: true,
})
</script>
