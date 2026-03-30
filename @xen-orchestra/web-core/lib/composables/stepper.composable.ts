import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export type StepperBindings = {
  steps: StepDefinition[]
  currentStep: number
}

export function useStepper(_steps: MaybeRefOrGetter<StepDefinition[]>) {
  const steps = toComputed(_steps)

  const currentStep = ref(0)

  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === steps.value.length - 1)

  function next() {
    if (!isLastStep.value) {
      currentStep.value++
    }
  }

  function prev() {
    if (!isFirstStep.value) {
      currentStep.value--
    }
  }

  const stepperBindings = computed<StepperBindings>(() => ({
    steps: steps.value,
    currentStep: currentStep.value,
  }))

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    next,
    prev,
    stepperBindings,
  }
}
