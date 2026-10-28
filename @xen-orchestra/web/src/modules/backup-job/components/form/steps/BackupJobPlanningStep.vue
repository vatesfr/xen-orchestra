<template>
  <div class="backup-job-planning-step">
    <UiAlert accent="info">{{ t('daylight-saving-time-warning') }}</UiAlert>
    <ScheduleCronEditor
      v-bind="bindings.cron"
      :timezone="bindings.timezone.modelValue"
      @update:timezone="bindings.timezone['onUpdate:modelValue']($event)"
    />

    <div v-if="!isMetadata" class="block">
      <span class="typo-body-bold">{{ t('failure-handling') }}</span>
      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.timeout" />
        <BackupJobFormNumberInput v-bind="bindings.nRetriesVmBackupFailures" />
      </BackupJobFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import ScheduleCronEditor from '@/modules/schedule/components/ScheduleCronEditor.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobPlanningForm['bindings']
  isMetadata: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-planning-step {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .block {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
