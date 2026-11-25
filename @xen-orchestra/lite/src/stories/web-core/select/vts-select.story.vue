<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('neutral', 'success', 'warning', 'danger').preset('neutral').widget(),
      prop('id').required().obj('FormSelectId').preset(id),
      slot(),
    ]"
  >
    <VtsSelect v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { upperFirst } from 'lodash-es'

const colors = ['blue', 'yellow', 'red', 'green', 'orange', 'purple', 'white', 'grey', 'black']

const { id } = useFormSelect(colors, {
  option: {
    label: color => `${upperFirst(color)} color`,
    disabled: color => color === 'blue' || color === 'orange' || color === 'black',
  },
  multiple: true,
  searchable: true,
  placeholder: 'Choose colors',
  searchPlaceholder: 'Search colors',
})
</script>
