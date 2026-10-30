<template>
  <div class="backup-job-form-step-card">
    <ScheduleStepInput :step :max-step :unit @update:step="model = getStepValues($event)" />
  </div>
</template>

<script lang="ts" setup>
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import ScheduleStepInput from '@/modules/schedule/components/ScheduleStepInput.vue'
import { computed } from 'vue'

const { options } = defineProps<{
  options: BackupJobFormOption<number>[]
  unit: string
}>()

const model = defineModel<number[]>({ required: true })

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
</script>

<style lang="postcss" scoped>
.backup-job-form-step-card {
  display: flex;
  align-items: center;
  padding: 1.6rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);
}
</style>
