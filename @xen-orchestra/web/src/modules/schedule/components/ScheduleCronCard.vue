<template>
  <ScheduleValuesCard
    class="schedule-cron-card"
    :title
    :options
    :columns
    :selected-values="selectedValues"
    @toggle="toggle($event)"
  >
    <template #header-actions>
      <slot name="header-actions" />
    </template>

    <template #footer>
      <ScheduleStepInput class="footer" :step :max-step :unit @update:step="updateStep($event)" />
    </template>
  </ScheduleValuesCard>
</template>

<script lang="ts" setup>
import ScheduleStepInput from '@/modules/schedule/components/ScheduleStepInput.vue'
import ScheduleValuesCard from '@/modules/schedule/components/ScheduleValuesCard.vue'
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

const selectedValues = computed(() => getSelectedValues(parsedField.value, range))

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
  .footer {
    padding: 1.6rem;
  }
}
</style>
