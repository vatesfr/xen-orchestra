<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('options').required().arr('FormOption<TData>').widget().preset(presets['Value only'].props.options),
      prop('searchable').bool().widget(),
      prop('required').bool().widget(),
      prop('multiple').bool().widget(),
      prop('placeholder').str().widget().preset('Select something'),
      prop('loading').bool().widget(),
      prop('showMax').num().widget(),
      model()
        .prop(p => p.arr('FormOptionValue'))
        .required()
        .preset([]),
      slot().help('').prop('option', 'FormOption<TData>'),
    ]"
    :presets
  >
    <VtsSelect v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model, prop, slot } from '@/libs/story/story-param'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { defineFormOptions } from '@core/packages/form-select/define-form-options.ts'

const colors = ['blue', 'yellow', 'red', 'green', 'orange', 'purple', 'white', 'grey', 'black']

const presets = {
  'Value only': {
    props: {
      options: defineFormOptions(colors),
    },
  },
  'Value + Label': {
    props: {
      options: defineFormOptions(colors, color => ({
        value: color,
        label: `This is the ${color} color`,
      })),
    },
  },
  'Disabled options': {
    props: {
      options: defineFormOptions(colors, (color, index) => ({
        value: color,
        label: `This is the ${color} color`,
        disabled: index === 0 || index === 4 || index === 8,
      })),
    },
  },
}
</script>
