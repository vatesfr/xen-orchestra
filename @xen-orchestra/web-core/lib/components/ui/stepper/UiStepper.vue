<!-- v1 -->
<template>
  <div class="ui-stepper">
    <div class="header">
      <div class="typo-body-regular description">
        {{ steps[currentStep]?.description ?? t('step-n-of', { current: currentStep + 1, total: steps.length }) }}
      </div>
      <div class="typo-h3">{{ steps[currentStep]?.label }}</div>
    </div>

    <div class="steps-container">
      <Step v-for="(_, index) in steps" :key="index" :is-active="index <= currentStep" />
    </div>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import Step from '@core/components/ui/stepper/Step.vue'
import { useI18n } from 'vue-i18n'

export type StepDefinition = {
  label: string
  description?: string
}

defineProps<{
  steps: StepDefinition[]
  currentStep: number
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-stepper {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .description {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .steps-container {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
