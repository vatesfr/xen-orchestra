<template>
  <ComponentStory :params>
    <FormSection v-bind="bindings">
      <FormInput />
    </FormSection>
  </ComponentStory>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import FormSection from '@/components/form/FormSection.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    label: {
      preset: 'Install settings',
      required: true,
    },
    collapsible: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  models: {
    collapsed: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Contains the form content' },
  },
})
</script>
