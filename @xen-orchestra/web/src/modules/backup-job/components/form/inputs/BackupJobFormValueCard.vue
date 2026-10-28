<template>
  <div class="backup-job-form-value-card">
    <div :class="{ error: errorMessages.length > 0 }" class="card">
      <span class="header typo-body-bold">{{ label }}</span>
      <div class="values" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
        <ScheduleCronValueButton
          v-for="option of options"
          :key="option.value"
          :selected="model.includes(option.value)"
          @toggle="toggle(option.value)"
        >
          {{ option.label }}
        </ScheduleCronValueButton>
      </div>
      <div v-if="withFooter || stepUnit !== undefined" class="footer typo-body-regular">
        <template v-if="stepUnit !== undefined">
          <span>{{ t('every') }}</span>
          <span class="step">
            <UiInput :model-value="step ?? ''" accent="brand" type="number" @update:model-value="updateStep($event)" />
          </span>
          <span>{{ stepUnit }}</span>
        </template>
      </div>
    </div>
    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>
      {{ message }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import ScheduleCronValueButton from '@/modules/schedule/components/ScheduleCronValueButton.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { options, error } = defineProps<{
  label: string
  options: { label: string; value: number }[]
  columns: number
  stepUnit?: string
  withFooter?: boolean
  error?: InputWrapperMessage
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

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

function toggle(value: number) {
  model.value = model.value.includes(value)
    ? model.value.filter(selected => selected !== value)
    : [...model.value, value].sort((a, b) => a - b)
}

function updateStep(rawStep: string | number | undefined) {
  const newStep = Number(rawStep)

  if (!Number.isInteger(newStep) || newStep < 1) {
    return
  }

  model.value = getStepValues(Math.min(newStep, maxStep.value))
}
</script>

<style lang="postcss" scoped>
.backup-job-form-value-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .card {
    display: flex;
    flex-direction: column;
    flex: 1;
    border: 0.1rem solid var(--color-neutral-border);
    overflow: hidden;
    border-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);

    &.error {
      border-color: var(--color-danger-item-base);
    }
  }

  .header {
    padding: 1.6rem;
  }

  .values {
    display: grid;
    align-content: center;
    gap: 0.4rem;
    flex: 1;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-secondary);
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    min-height: 7.2rem;
    padding: 1.6rem;
  }

  .step {
    width: 10rem;
  }
}
</style>
