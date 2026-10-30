<template>
  <div class="backup-job-form-calendar-cards">
    <BackupJobFormValueCard v-bind="monthDays" :columns="7" />
    <div class="side">
      <BackupJobFormValueCard v-bind="weekDays" :columns="7" />
      <BackupJobFormStepCard
        :model-value="monthDays.modelValue"
        :options="monthDays.options"
        :unit="t('cron:unit:day')"
        @update:model-value="monthDays['onUpdate:modelValue']($event)"
      />
    </div>
    <BackupJobFormValueCard v-bind="hours" :columns="6" />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormStepCard from '@/modules/backup-job/components/form/inputs/BackupJobFormStepCard.vue'
import BackupJobFormValueCard from '@/modules/backup-job/components/form/inputs/BackupJobFormValueCard.vue'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { useI18n } from 'vue-i18n'

export type BackupJobFormCalendarBinding = {
  label: string
  options: BackupJobFormOption<number>[]
  modelValue: number[]
  'onUpdate:modelValue': (value: number[]) => void
  error?: InputWrapperMessage
}

defineProps<{
  monthDays: BackupJobFormCalendarBinding
  weekDays: BackupJobFormCalendarBinding
  hours: BackupJobFormCalendarBinding
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-form-calendar-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.6rem;

  @media (--small) {
    grid-template-columns: 1fr;
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    & > :last-child {
      flex: 1;
    }
  }
}
</style>
