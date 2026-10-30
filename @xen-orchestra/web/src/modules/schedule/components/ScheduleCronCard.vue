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

    <ScheduleStepInput class="footer" :step :max-step :unit @update:step="updateStep($event)" />
  </div>
</template>

<script lang="ts" setup>
import ScheduleCronValueButton from '@/modules/schedule/components/ScheduleCronValueButton.vue'
import ScheduleStepInput from '@/modules/schedule/components/ScheduleStepInput.vue'
import type { ScheduleCalendarOption } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
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
import { computed } from 'vue'

const { range } = defineProps<{
  title: string
  unit: string
  options: ScheduleCalendarOption[]
  columns: number
  range: CronFieldRange
}>()

const field = defineModel<string>({ required: true })

defineSlots<{
  'header-actions'?(): any
}>()

const parsedField = computed(() => parseCronField(field.value, range))

const selectedValues = computed(() => new Set(getSelectedValues(parsedField.value, range)))

const step = computed(() => getCronFieldStep(parsedField.value))

const maxStep = computed(() => getMaxStep(range))

function toggle(value: number) {
  field.value = formatCronField(toggleCronFieldValue(parsedField.value, range, value))
}

function updateStep(newStep: number) {
  field.value = formatCronField(setCronFieldStep(newStep))
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
    padding: 1.6rem;
  }
}
</style>
