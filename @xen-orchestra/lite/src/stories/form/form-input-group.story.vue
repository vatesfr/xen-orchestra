<template>
  <ComponentStory :params="[slot().help('Can contain multiple FormInput and FormSelect')]">
    <FormInputGroup>
      <FormInput />
      <FormInput />
      <FormSelect>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </FormSelect>
    </FormInputGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormInputGroup from '@/components/form/FormInputGroup.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import { slot } from '@/libs/story/story-param'
</script>
