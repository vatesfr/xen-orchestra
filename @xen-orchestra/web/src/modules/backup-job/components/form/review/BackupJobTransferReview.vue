<template>
  <BackupJobReviewSubtitle>{{ t('general-information') }}</BackupJobReviewSubtitle>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow :label="t('source-speed-limit')" :value="speedLimit" />
    <VtsTabularKeyValueRow :label="t('vm-read-concurrency')" :value="toText(form.bindings.concurrency.modelValue)" />
    <VtsTabularKeyValueRow
      v-if="!isIncremental && !isMirror"
      :label="t('compression-type')"
      :value="getOptionLabel(form.bindings.compression.options, form.bindings.compression.modelValue)"
    />
  </VtsTabularKeyValueList>

  <template v-if="isIncremental && !isMirror">
    <BackupJobReviewSubtitle>{{ t('incremental-specifics') }}</BackupJobReviewSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow
        :label="t('key-backup')"
        :value="getOptionLabel(form.bindings.keyBackup.options, form.bindings.keyBackup.modelValue)"
      />
      <template v-if="form.bindings.keyBackup.modelValue === 'dynamic'">
        <VtsTabularKeyValueRow
          :label="t('days-of-the-month')"
          :value="getSelectedLabels(form.bindings.keyBackupMonthDays)"
        />
        <VtsTabularKeyValueRow
          :label="t('days-of-the-week')"
          :value="getSelectedLabels(form.bindings.keyBackupWeekDays)"
        />
        <VtsTabularKeyValueRow :label="t('hours')" :value="getSelectedLabels(form.bindings.keyBackupHours)" />
      </template>
      <VtsTabularKeyValueRow :label="t('network-block-device-nbd')">
        <template #value>
          <VtsStatus :status="form.bindings.preferNbd.modelValue" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow
        v-if="form.bindings.preferNbd.modelValue"
        :label="t('nbd-concurrency-per-disk')"
        :value="toText(form.bindings.nbdConcurrency.modelValue)"
      />
    </VtsTabularKeyValueList>
  </template>

  <template v-if="!isMirror">
    <BackupJobReviewSubtitle>{{ t('snapshot') }}</BackupJobReviewSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('offline-backup')">
        <template #value>
          <VtsStatus :status="form.formData.offlineBackup" />
        </template>
      </VtsTabularKeyValueRow>
      <template v-if="!form.formData.offlineBackup">
        <VtsTabularKeyValueRow
          :label="t('snapshot-mode')"
          :value="getOptionLabel(form.bindings.snapshotMode.options, form.formData.snapshotMode)"
        />
        <VtsTabularKeyValueRow :label="t('snapshot-synchronisation')" :value="snapshotSyncLabel" />
        <VtsTabularKeyValueRow
          :label="t('minimum-snapshots-to-retain')"
          :value="toText(form.formData.snapshotRetention)"
        />
      </template>
    </VtsTabularKeyValueList>
  </template>
</template>

<script lang="ts" setup>
import BackupJobReviewSubtitle from '@/modules/backup-job/components/form/review/BackupJobReviewSubtitle.vue'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import { getOptionLabel, getSelectedLabels } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobTransferForm
  isIncremental: boolean
  isMirror: boolean
}>()

const { t } = useI18n()

function toText(value: number | undefined): string | undefined {
  return value === undefined ? undefined : String(value)
}

const speedLimit = computed(() =>
  form.bindings.maxExportRate.modelValue === undefined
    ? undefined
    : `${form.bindings.maxExportRate.modelValue} ${t('bytes:mibs')}`
)

const snapshotSyncLabel = computed(() => {
  const label = getOptionLabel(form.bindings.snapshotSync.options, form.formData.snapshotSync)

  return form.formData.snapshotSync === 'smart' && form.formData.snapshotSyncTag !== undefined
    ? `${label} (${form.formData.snapshotSyncTag})`
    : label
})
</script>
