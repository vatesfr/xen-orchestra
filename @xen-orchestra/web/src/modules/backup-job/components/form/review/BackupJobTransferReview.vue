<template>
  <BackupJobReviewSubtitle>{{ t('general-information') }}</BackupJobReviewSubtitle>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow :label="t('source-speed-limit')" :value="speedLimit" />
    <VtsTabularKeyValueRow :label="t('vm-read-concurrency')" :value="toText(form.bindings.concurrency.modelValue)" />
  </VtsTabularKeyValueList>

  <template v-if="isIncremental">
    <BackupJobReviewSubtitle>{{ t('incremental-specifics') }}</BackupJobReviewSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('key-backup')">
        <template #value>
          <BackupJobPendingMockup />
        </template>
      </VtsTabularKeyValueRow>
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

  <BackupJobReviewSubtitle>{{ t('snapshot') }}</BackupJobReviewSubtitle>
  <VtsTabularKeyValueList>
    <VtsTabularKeyValueRow
      :label="t('snapshot-mode')"
      :value="getOptionLabel(form.bindings.snapshotMode.options, form.bindings.snapshotMode.modelValue)"
    />
    <VtsTabularKeyValueRow :label="t('snapshot-synchronisation')" :value="snapshotSyncLabel" />
  </VtsTabularKeyValueList>
</template>

<script lang="ts" setup>
import BackupJobPendingMockup from '@/modules/backup-job/components/form/BackupJobPendingMockup.vue'
import BackupJobReviewSubtitle from '@/modules/backup-job/components/form/review/BackupJobReviewSubtitle.vue'
import type { BackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import { getOptionLabel } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobTransferForm
  isIncremental: boolean
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
  const label = getOptionLabel(form.bindings.snapshotSync.options, form.bindings.snapshotSync.modelValue)

  return form.bindings.snapshotSync.modelValue === 'smart' && form.formData.snapshotSyncTag !== undefined
    ? `${label} (${form.formData.snapshotSyncTag})`
    : label
})
</script>
