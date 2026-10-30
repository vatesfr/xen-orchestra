<template>
  <div class="backup-job-target-health-check-section">
    <UiTitle>{{ t('health-check') }}</UiTitle>

    <BackupJobFormCheckbox v-bind="bindings.healthCheckEnabled" />

    <template v-if="bindings.healthCheckEnabled.modelValue">
      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckSr" />
        <BackupJobFormNumberInput v-bind="bindings.healthCheckTimeout" />
      </BackupJobFormRow>

      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="bindings.healthCheckVmTags" />
      </BackupJobFormRow>

      <div class="block">
        <BackupJobFormRadio v-bind="bindings.healthCheckSchedule" />

        <BackupJobFormCalendarCards
          v-if="bindings.healthCheckSchedule.modelValue === 'dynamic'"
          :month-days="bindings.healthCheckMonthDays"
          :week-days="bindings.healthCheckWeekDays"
          :hours="bindings.healthCheckHours"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCalendarCards from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTargetForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-target-health-check-section {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .block {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
