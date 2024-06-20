<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      colorProp().ctx(),
      iconProp('before').type('IconDefinition | string'),
      iconProp('after').type('IconDefinition | string'),
      model().type('string').required(),
      prop('right').bool().widget(),
      prop('disabled').bool().widget().ctx(),
      prop('wrapper-attrs').obj('HTMLAttributes').widget().preset({ foo: 'bar' }),
      prop('before-width').str().widget(),
      prop('after-width').str().widget(),
    ]"
    :presets
  >
    <FormInput v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import { colorProp, iconProp, model, prop } from '@/libs/story/story-param'
import { faDollarSign } from '@fortawesome/free-solid-svg-icons'

const presets = {
  $100: {
    props: {
      modelValue: '100',
      before: faDollarSign,
    },
  },
}
</script>
