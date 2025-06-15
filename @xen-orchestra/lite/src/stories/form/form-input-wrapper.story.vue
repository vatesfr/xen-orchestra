<template>
  <ComponentStory :params>
    <FormInputWrapper v-bind="bindings">
      <FormInput />
    </FormInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { type IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    label: {
      preset: 'My input',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    learnMoreUrl: {
      preset: 'https://google.com',
    },
    warning: {
      preset: ref<string>(),
      type: 'string',
    },
    error: {
      preset: ref<string>(),
      type: 'string',
    },
    help: {
      preset: '256 by default',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    light: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: { help: 'Contains the input' },
  },
})
</script>
