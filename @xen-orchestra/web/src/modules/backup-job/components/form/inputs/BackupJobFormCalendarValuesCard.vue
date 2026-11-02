<template>
  <div class="backup-job-form-calendar-values-card">
    <ScheduleValuesCard
      class="card"
      :title="label"
      :options
      :columns
      :selected-values="model"
      :error="errorMessage !== undefined"
      @toggle="toggle($event)"
    />
    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>
      {{ errorMessage }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { toErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import ScheduleValuesCard from '@/modules/schedule/components/ScheduleValuesCard.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  options: BackupJobFormOption<number>[]
  columns: number
  error?: InputWrapperMessage
}>()

const model = defineModel<number[]>({ required: true })

const errorMessage = computed(() => toErrorMessage(error))

function toggle(value: number) {
  model.value = model.value.includes(value)
    ? model.value.filter(selected => selected !== value)
    : [...model.value, value].sort((a, b) => a - b)
}
</script>

<style lang="postcss" scoped>
.backup-job-form-calendar-values-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .card {
    flex: 1;
  }
}
</style>
