<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').type('string').widget().preset('My input'),
      iconProp(),
      prop('learnMoreUrl').type('string').widget().preset('https://google.com'),
      prop('warning').type('string').widget(),
      prop('error').type('string').widget(),
      prop('help').type('string').widget().preset('256 by default'),
      prop('disabled').type('boolean').widget().ctx(),
      prop('light').bool().widget(),
      slot().help('Contains the input'),
    ]"
  >
    <FormInputWrapper v-bind="properties">
      <FormInput v-model="modelValue" />
    </FormInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import { iconProp, prop, slot } from '@/libs/story/story-param'
import { ref } from 'vue'

const modelValue = ref('')
</script>
