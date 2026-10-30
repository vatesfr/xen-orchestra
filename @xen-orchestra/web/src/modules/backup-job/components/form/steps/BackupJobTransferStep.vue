<template>
  <div class="backup-job-transfer-step">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.maxExportRate" :unit="t('bytes:mibs')" />
        <BackupJobFormNumberInput v-bind="bindings.concurrency" />
      </BackupJobFormRow>

      <BackupJobFormRadio v-if="!isIncremental && !isMirror" v-bind="bindings.compression" />
    </div>

    <div v-if="isIncremental && !isMirror" class="section">
      <UiTitle>{{ t('incremental-specifics') }}</UiTitle>

      <BackupJobFormRadio v-bind="bindings.keyBackup">
        <template #info>
          <UiInfo accent="info" wrap>{{ t('key-backup-info') }}</UiInfo>
        </template>
      </BackupJobFormRadio>

      <template v-if="bindings.keyBackup.modelValue === 'dynamic'">
        <BackupJobFormCalendarCards
          :month-days="bindings.keyBackupMonthDays"
          :week-days="bindings.keyBackupWeekDays"
          :hours="bindings.keyBackupHours"
        />

        <UiInfo accent="info" wrap>{{ t('key-backup-dynamic-info') }}</UiInfo>
      </template>

      <BackupJobFormCheckbox v-bind="bindings.preferNbd" />

      <BackupJobFormRow v-if="bindings.preferNbd.modelValue">
        <BackupJobFormNumberInput v-bind="bindings.nbdConcurrency" />
      </BackupJobFormRow>
    </div>

    <div v-if="!isMirror" class="section">
      <UiTitle>{{ t('snapshot') }}</UiTitle>

      <BackupJobFormCheckbox v-bind="bindings.offlineBackup" />

      <template v-if="!bindings.offlineBackup.modelValue">
        <BackupJobFormRadio v-bind="bindings.snapshotMode" vertical />

        <BackupJobFormRadio v-bind="bindings.snapshotSync" />

        <BackupJobFormRow v-if="bindings.snapshotSync.modelValue === 'smart'">
          <BackupJobFormSelect v-bind="bindings.snapshotSyncTag" />
        </BackupJobFormRow>

        <BackupJobFormSnapshotRetention v-bind="bindings.snapshotRetention" />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCalendarCards from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobFormSnapshotRetention from '@/modules/backup-job/components/form/inputs/BackupJobFormSnapshotRetention.vue'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTransferForm['bindings']
  isIncremental: boolean
  isMirror: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-transfer-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
