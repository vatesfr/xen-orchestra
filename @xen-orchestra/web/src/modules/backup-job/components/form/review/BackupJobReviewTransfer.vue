<template>
  <UiSubtitle>{{ t('general-information') }}</UiSubtitle>
  <VtsTabularKeyValueList>
    <BackupJobReviewRow
      :label="t('source-speed-limit')"
      :value="speedLimit"
      :overridden="isOverridden('maxExportRate')"
    />
    <BackupJobReviewRow
      :label="t('vm-read-concurrency')"
      :value="form.formData.concurrency?.toString()"
      :overridden="isOverridden('concurrency')"
    />
    <BackupJobReviewRow
      v-if="!isIncremental && !isMirror"
      :label="t('compression-type')"
      :value="compressionLabel"
      :overridden="isOverridden('compression')"
    />
  </VtsTabularKeyValueList>

  <template v-if="isIncremental && !isMirror">
    <UiSubtitle>{{ t('incremental-specifics') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <BackupJobReviewRow :label="t('key-backup')" :value="keyBackupLabel" :overridden="isOverridden('keyBackup')" />
      <BackupJobReviewCalendarRows
        v-if="form.bindings.keyBackup.modelValue === 'dynamic'"
        :month-days="form.bindings.keyBackupMonthDays"
        :week-days="form.bindings.keyBackupWeekDays"
        :hours="form.bindings.keyBackupHours"
        :month-days-overridden="isOverridden('keyBackupMonthDays')"
        :week-days-overridden="isOverridden('keyBackupWeekDays')"
        :hours-overridden="isOverridden('keyBackupHours')"
      />
      <BackupJobReviewRow :label="t('network-block-device-nbd')" :overridden="isOverridden('preferNbd')">
        <VtsStatus :status="form.bindings.preferNbd.modelValue" />
      </BackupJobReviewRow>
      <BackupJobReviewRow
        v-if="form.bindings.preferNbd.modelValue"
        :label="t('nbd-concurrency-per-disk')"
        :value="form.formData.nbdConcurrency?.toString()"
        :overridden="isOverridden('nbdConcurrency')"
      />
    </VtsTabularKeyValueList>
  </template>

  <template v-if="!isMirror">
    <UiSubtitle>{{ t('snapshot') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <BackupJobReviewRow :label="t('offline-backup')" :overridden="isOverridden('offlineBackup')">
        <VtsStatus :status="form.formData.offlineBackup" />
      </BackupJobReviewRow>
      <template v-if="!form.formData.offlineBackup">
        <BackupJobReviewRow
          :label="t('snapshot-mode')"
          :value="snapshotModeLabel"
          :overridden="isOverridden('snapshotMode')"
        />
        <BackupJobReviewRow
          :label="t('snapshot-synchronisation')"
          :value="snapshotSyncLabel"
          :overridden="isOverridden('snapshotSync', 'snapshotSyncTag')"
        />
        <BackupJobReviewRow
          :label="t('minimum-snapshots-to-retain')"
          :value="form.formData.snapshotRetention?.toString()"
          :overridden="isOverridden('snapshotRetention')"
        />
      </template>
    </VtsTabularKeyValueList>
  </template>
</template>

<script lang="ts" setup>
import BackupJobReviewCalendarRows from '@/modules/backup-job/components/form/review/BackupJobReviewCalendarRows.vue'
import BackupJobReviewRow from '@/modules/backup-job/components/form/review/BackupJobReviewRow.vue'
import { useBackupJobReviewChanges } from '@/modules/backup-job/composables/use-backup-job-review-changes.composable.ts'
import type {
  BackupJobTransferForm,
  BackupJobTransferFormData,
} from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form, saved } = defineProps<{
  form: BackupJobTransferForm
  saved?: BackupJobTransferFormData
  isIncremental: boolean
  isMirror: boolean
}>()

const { t } = useI18n()

const { isOverridden } = useBackupJobReviewChanges(
  () => form.formData,
  () => saved
)

const speedLimit = computed(() =>
  form.bindings.maxExportRate.modelValue === undefined
    ? undefined
    : `${form.bindings.maxExportRate.modelValue} ${t('bytes:mibs')}`
)

const compressionLabel = computed(() => form.getCompressionLabel(form.formData.compression))

const keyBackupLabel = computed(() => form.getKeyBackupLabel(form.formData.keyBackup))

const snapshotModeLabel = computed(() => form.getSnapshotModeLabel(form.formData.snapshotMode))

const snapshotSyncLabel = computed(() => {
  const label = form.getSnapshotSyncLabel(form.formData.snapshotSync)

  return form.formData.snapshotSync === 'smart' && form.formData.snapshotSyncTag !== undefined
    ? `${label} (${form.formData.snapshotSyncTag})`
    : label
})
</script>
