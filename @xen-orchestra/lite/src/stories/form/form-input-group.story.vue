<template>
  <ComponentStory :params>
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
import FormInput from '@/components/form/FormInput.vue'
import FormInputGroup from '@/components/form/FormInputGroup.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'

const { params } = useStory({
  slots: {
    default: { help: 'Can contain multiple FormInput and FormSelect' },
  },
})
</script>
