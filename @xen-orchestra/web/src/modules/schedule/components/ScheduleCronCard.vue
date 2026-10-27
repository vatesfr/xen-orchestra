<template>
  <div class="schedule-cron-card">
    <div class="header">
      <span class="typo-body-bold">{{ title }}</span>
      <slot name="header-actions" />
    </div>

    <div class="values" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <ScheduleCronValueButton
        v-for="option of options"
        :key="option.value"
        :selected="selectedValues.has(option.value)"
        @toggle="toggle(option.value)"
      >
        {{ option.label }}
      </ScheduleCronValueButton>
    </div>

    <div class="footer typo-body-regular">
      <span>{{ t('every') }}</span>
      <span class="step">
        <UiInput :model-value="step ?? ''" accent="brand" type="number" @update:model-value="updateStep($event)" />
      </span>
      <span>{{ unit }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ScheduleCronValueButton from '@/modules/schedule/components/ScheduleCronValueButton.vue'
import {
  type CronFieldRange,
  formatCronField,
  getCronFieldStep,
  getMaxStep,
  getSelectedValues,
  parseCronField,
  setCronFieldStep,
  toggleCronFieldValue,
} from '@/modules/schedule/utils/cron.util.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type ScheduleCronCardOption = { label: string; value: number }

const { range } = defineProps<{
  title: string
  unit: string
  options: ScheduleCronCardOption[]
  columns: number
  range: CronFieldRange
}>()

const field = defineModel<string>({ required: true })

defineSlots<{
  'header-actions'?(): any
}>()

const { t } = useI18n()

const parsedField = computed(() => parseCronField(field.value, range))

const selectedValues = computed(() => new Set(getSelectedValues(parsedField.value, range)))

const step = computed(() => getCronFieldStep(parsedField.value))

function toggle(value: number) {
  field.value = formatCronField(toggleCronFieldValue(parsedField.value, range, value))
}

function updateStep(rawStep: string | number | undefined) {
  const newStep = Number(rawStep)

  if (!Number.isInteger(newStep) || newStep < 1) {
    return
  }

  field.value = formatCronField(setCronFieldStep(Math.min(newStep, getMaxStep(range))))
}
</script>

<style lang="postcss" scoped>
.schedule-cron-card {
  display: flex;
  flex-direction: column;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
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
    padding: 1.6rem;
  }

  .step {
    width: 10rem;
  }
}
</style>
