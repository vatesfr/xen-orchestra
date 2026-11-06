<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('steps').arr('NumberedStepDefinition').required().preset(steps),
      prop('currentStep').num().required().preset(0).help('Index of the current step, earlier steps are done'),
    ]"
    :presets
  >
    <UiNumberedStepper v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import UiNumberedStepper, {
  type NumberedStepDefinition,
} from '@core/components/ui/numbered-stepper/UiNumberedStepper.vue'

const steps: NumberedStepDefinition[] = [
  { label: 'General information' },
  { label: 'Settings' },
  { label: 'Options' },
  { label: 'Review' },
]

const presets = {
  'First step': { props: { steps, currentStep: 0 } },
  'Intermediate step': { props: { steps, currentStep: 2 } },
  'Last step': { props: { steps, currentStep: 3 } },
}
</script>
