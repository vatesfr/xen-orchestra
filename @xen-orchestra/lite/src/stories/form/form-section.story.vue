<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').required().str().preset('Install settings').widget(),
      prop('collapsible').bool().widget(),
      model('collapsed').prop(p => p.bool()),
      slot(),
    ]"
  >
    <FormSection v-bind="properties">
      <FormInput />
    </FormSection>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSection from '@/components/form/FormSection.vue'
import { model, prop, slot } from '@/libs/story/story-param'
</script>
