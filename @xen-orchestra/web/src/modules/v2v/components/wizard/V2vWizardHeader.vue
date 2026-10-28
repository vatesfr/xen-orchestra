<template>
  <div class="v2v-wizard-header">
    <UiHeadBar icon="fa:route">
      {{ t('migrate-vms') }}
      <template v-if="summary !== undefined" #actions>
        <span class="typo-body-regular-small summary">{{ summary }}</span>
      </template>
    </UiHeadBar>
    <UiNumberedStepper :steps :current-step="currentStepIndex" class="stepper" />
  </div>
</template>

<script lang="ts" setup>
import { V2V_WIZARD_STEPS, type V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiNumberedStepper from '@core/components/ui/numbered-stepper/UiNumberedStepper.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { currentStep } = defineProps<{
  currentStep: V2vWizardStep
  summary?: string
}>()

const { t } = useI18n()

const stepLabels = computed<Record<V2vWizardStep, string>>(() => ({
  source: t('source'),
  destination: t('destination'),
  vms: t('vms'),
  mapping: t('mapping'),
  review: t('review'),
}))

const steps = computed(() => V2V_WIZARD_STEPS.map(step => ({ label: stepLabels.value[step] })))

const currentStepIndex = computed(() => V2V_WIZARD_STEPS.indexOf(currentStep))
</script>

<style lang="postcss" scoped>
.v2v-wizard-header {
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-background-primary);
  border-block-end: 0.1rem solid var(--color-neutral-border);

  .summary {
    color: var(--color-neutral-txt-secondary);
  }

  .stepper {
    padding: 1.2rem 1.6rem;
  }
}
</style>
