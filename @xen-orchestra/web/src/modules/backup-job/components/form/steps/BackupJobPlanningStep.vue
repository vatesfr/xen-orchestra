<template>
  <div class="backup-job-planning-step">
    <UiToggle
      :model-value="bindings.enabled.modelValue"
      @update:model-value="bindings.enabled['onUpdate:modelValue']($event ?? false)"
    >
      {{ t('enabled') }}
    </UiToggle>
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

    <div class="block">
      <span class="typo-body-bold">{{ t('report') }}</span>
      <UiInfo accent="info" wrap>{{ t('report-plugins-info') }}</UiInfo>
      <BackupJobFormRadio v-bind="bindings.reportWhen" />
      <BackupJobFormEmailInput v-bind="bindings.reportRecipients" />
      <BackupJobFormCheckbox v-bind="bindings.hideSuccessfulItems" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormEmailInput from '@/modules/backup-job/components/form/inputs/BackupJobFormEmailInput.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import type { BackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import ScheduleCronEditor from '@/modules/schedule/components/ScheduleCronEditor.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
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
