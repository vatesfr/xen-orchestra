<template>
  <UiCard class="backup-job-form-calendar-interval-card">
    <ScheduleStepInput :step :max-step :unit @update:step="newStep => (model = getStepValues(optionValues, newStep))" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { BackupJobFormOption } from '@/modules/backup-job/types/backup-job-form.type.ts'
import ScheduleStepInput from '@/modules/schedule/components/ScheduleStepInput.vue'
import { getMaxStep, getStepValues } from '@/modules/schedule/utils/cron.util.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'

const { options } = defineProps<{
  options: BackupJobFormOption<number>[]
  unit: string
}>()

const model = defineModel<number[]>({ required: true })

const optionValues = computed(() => options.map(option => option.value))

const maxStep = computed(() => getMaxStep({ min: 0, max: options.length - 1 }))

const step = computed(() => {
  for (let candidate = 1; candidate <= maxStep.value; candidate++) {
    const values = getStepValues(optionValues.value, candidate)

    if (values.length === model.value.length && values.every((value, index) => value === model.value[index])) {
      return candidate
    }
  }

  return undefined
})
</script>

<style lang="postcss" scoped>
.backup-job-form-calendar-interval-card {
  justify-content: center;
  padding: 1.6rem;
}
</style>
