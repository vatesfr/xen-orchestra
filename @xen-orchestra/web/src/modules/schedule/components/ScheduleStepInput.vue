<template>
  <div class="schedule-step-input typo-body-regular">
    <span>{{ t('every') }}</span>
    <span class="step">
      <UiInput :model-value="step ?? ''" accent="brand" type="number" @update:model-value="updateStep($event)" />
    </span>
    <span>{{ unit }}</span>
  </div>
</template>

<script lang="ts" setup>
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

const { maxStep } = defineProps<{
  step: number | undefined
  maxStep: number
  unit: string
}>()

const emit = defineEmits<{
  'update:step': [step: number]
}>()

const { t } = useI18n()

function updateStep(rawStep: string | number | undefined) {
  const newStep = Number(rawStep)

  if (!Number.isInteger(newStep) || newStep < 1) {
    return
  }

  emit('update:step', Math.min(newStep, maxStep))
}
</script>

<style lang="postcss" scoped>
.schedule-step-input {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .step {
    width: 10rem;
  }
}
</style>
