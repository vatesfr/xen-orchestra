<template>
  <ComponentStory :params="[slot().help('Can contain multiple FormInput and FormSelect')]">
    <FormInputGroup>
      <FormInput />
      <FormInput />
      <VtsSelect :id accent="brand" />
    </FormInputGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormInputGroup from '@/components/form/FormInputGroup.vue'
import { slot } from '@/libs/story/story-param'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'

const { id } = useFormSelect(['A', 'B', 'C'])
</script>
