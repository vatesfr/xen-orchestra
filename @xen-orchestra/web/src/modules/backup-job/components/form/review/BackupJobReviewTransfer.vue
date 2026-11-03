<template>
  <UiSubtitle>{{ t('general-information') }}</UiSubtitle>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow :label="t('source-speed-limit')" :value="speedLimit" />
    <VtsTabularKeyValueRow :label="t('vm-read-concurrency')" :value="form.formData.concurrency?.toString()" />
    <VtsTabularKeyValueRow
      v-if="!isIncremental && !isMirror"
      :label="t('compression-type')"
      :value="compressionLabel"
    />
  </VtsTabularKeyValueList>

  <template v-if="isIncremental && !isMirror">
    <UiSubtitle>{{ t('incremental-specifics') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('key-backup')" :value="keyBackupLabel" />
      <BackupJobReviewCalendarRows
        v-if="form.bindings.keyBackup.modelValue === 'dynamic'"
        :month-days="form.bindings.keyBackupMonthDays"
        :week-days="form.bindings.keyBackupWeekDays"
        :hours="form.bindings.keyBackupHours"
      />
      <VtsTabularKeyValueRow :label="t('network-block-device-nbd')">
        <template #value>
          <VtsStatus :status="form.bindings.preferNbd.modelValue" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow
        v-if="form.bindings.preferNbd.modelValue"
        :label="t('nbd-concurrency-per-disk')"
        :value="form.formData.nbdConcurrency?.toString()"
      />
    </VtsTabularKeyValueList>
  </template>

  <template v-if="!isMirror">
    <UiSubtitle>{{ t('snapshot') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('offline-backup')">
        <template #value>
          <VtsStatus :status="form.formData.offlineBackup" />
        </template>
      </VtsTabularKeyValueRow>
      <template v-if="!form.formData.offlineBackup">
        <VtsTabularKeyValueRow :label="t('snapshot-mode')" :value="snapshotModeLabel" />
        <VtsTabularKeyValueRow :label="t('snapshot-synchronisation')" :value="snapshotSyncLabel" />
        <VtsTabularKeyValueRow
          :label="t('minimum-snapshots-to-retain')"
          :value="form.formData.snapshotRetention?.toString()"
        />
      </template>
    </VtsTabularKeyValueList>
  </template>
</template>

<script lang="ts" setup>
import BackupJobReviewCalendarRows from '@/modules/backup-job/components/form/review/BackupJobReviewCalendarRows.vue'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobTransferForm
  isIncremental: boolean
  isMirror: boolean
}>()

const { t } = useI18n()

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
