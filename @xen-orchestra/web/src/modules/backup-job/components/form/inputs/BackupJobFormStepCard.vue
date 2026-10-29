<template>
  <div class="backup-job-form-step-card typo-body-regular">
    <span>{{ t('every') }}</span>
    <span class="step">
      <UiInput :model-value="step ?? ''" accent="brand" type="number" @update:model-value="updateStep($event)" />
    </span>
    <span>{{ unit }}</span>
  </div>
</template>

<script lang="ts" setup>
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { options } = defineProps<{
  options: { label: string; value: number }[]
  unit: string
}>()

const model = defineModel<number[]>({ required: true })

const { t } = useI18n()

const maxStep = computed(() => Math.floor(options.length / 2))

function getStepValues(step: number): number[] {
  return options.filter((_, index) => index % step === 0).map(option => option.value)
}

const step = computed(() => {
  for (let candidate = 1; candidate <= maxStep.value; candidate++) {
    const values = getStepValues(candidate)

    if (values.length === model.value.length && values.every((value, index) => value === model.value[index])) {
      return candidate
    }
  }

  return undefined
})

function updateStep(rawStep: string | number | undefined) {
  const newStep = Number(rawStep)

  if (!Number.isInteger(newStep) || newStep < 1) {
    return
  }

  model.value = getStepValues(Math.min(newStep, maxStep.value))
}
</script>

<style lang="postcss" scoped>
.backup-job-form-step-card {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.6rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);

  .step {
    width: 10rem;
  }
}
</style>
