<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('steps').arr('StepDefinition').required().preset(steps),
      prop('currentStep').num().required().preset(currentStep),
      slot('default').help('Content of the current step'),
      slot('actions').help('Navigation buttons'),
      setting('contentStep1').preset('General information content').widget(text()).help('Content for step 1'),
      setting('contentStep2').preset('Next content').widget(text()).help('Content for step 2'),
      setting('contentStep3').preset('Review content').widget(text()).help('Content for step 3'),
      setting('backLabel').preset('Back').widget(text()).help('Label for the back button'),
      setting('nextLabel').preset('Next').widget(text()).help('Label for the next button'),
      setting('finishLabel').preset('Finish').widget(text()).help('Label for the finish button on last step'),
    ]"
    :presets
  >
    <UiStepper v-bind="{ ...properties, ...stepperBindings }">
      <template #default>
        <div v-if="currentStep === 0">{{ settings.contentStep1 }}</div>
        <div v-else-if="currentStep === 1">{{ settings.contentStep2 }}</div>
        <div v-else-if="currentStep === 2">{{ settings.contentStep3 }}</div>

        <div class="actions">
          <UiButton accent="brand" variant="secondary" size="medium" :disabled="isFirstStep" @click="prev()">
            {{ settings.backLabel }}
          </UiButton>
          <UiButton accent="brand" variant="primary" size="medium" @click="next()">
            {{ isLastStep ? settings.finishLabel : settings.nextLabel }}
          </UiButton>
        </div>
      </template>
    </UiStepper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiStepper, { type StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { useStepper } from '@core/composables/stepper.composable'

const steps: StepDefinition[] = [{ label: 'General information' }, { label: 'information' }, { label: 'Review' }]

const { stepperBindings, currentStep, isFirstStep, isLastStep, next, prev } = useStepper(steps)

const presets = {
  'First step': {
    props: {
      steps,
      currentStep: 0,
    },
  },
  'Intermediate step': {
    props: {
      steps,
      currentStep: 1,
    },
  },
  'Last step': {
    props: {
      steps,
      currentStep: 2,
    },
  },
}
</script>

<style lang="postcss" scoped>
.actions {
  display: flex;
  gap: 0.8rem;
}
</style>
