<!-- v1 -->
<template>
  <div class="ui-stepper">
    <div class="header">
      <div class="typo-body-regular description">
        {{ steps[currentStep]?.description ?? t('step-n-of', { current: currentStep + 1, total: steps.length }) }}
      </div>
      <div class="typo-h3">{{ steps[currentStep]?.label }}</div>
    </div>

    <div class="track">
      <Step
        v-for="index in steps.length"
        :key="index - 1"
        :is-active="index - 1 === currentStep"
        :is-completed="index - 1 < currentStep"
      />
    </div>

    <slot />

    <slot name="actions" />
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
  actions(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-stepper {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .description {
    color: var(--color-neutral-txt-secondary);
  }
}

.track {
  display: flex;
  gap: 0.8rem;
}
</style>
