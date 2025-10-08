<template>
  <UiCard>
    <UiTitle>{{ t('settings') }}</UiTitle>
    <VtsColumns>
      <VtsColumn>
        <UiLabelValue :label="t('proxy')" :value="proxy?.name" />
        <UiLabelValue :label="t('snapshot-mode')">
          <template v-if="backupJob.mode" #value>
            <UiTag variant="secondary" accent="info">{{ t(snapshotModeTranslation) }}</UiTag>
          </template>
        </UiLabelValue>
        <UiLabelValue
          :label="t('vm-backup-failure-number-of-retries')"
          :value="
            settings.nRetriesVmBackupFailures !== undefined ? String(settings.nRetriesVmBackupFailures) : undefined
          "
        />
        <UiLabelValue :label="t('timeout')" :value="formattedTimeout" />
      </VtsColumn>
      <VtsColumn>
        <UiLabelValue
          :label="t('speed-limit')"
          :value="maxExportRate ? `${maxExportRate.value} ${maxExportRate.prefix}` : undefined"
        />
        <UiLabelValue :label="t('report-when')" :value="reportWhenValueTranslation" />
        <UiLabelValue :label="t('report-recipients')" :value="settings.reportRecipients" />
        <UiLabelValue
          :label="t('concurrency')"
          :value="settings.concurrency !== undefined ? String(settings.concurrency) : undefined"
        />
      </VtsColumn>
      <VtsColumn>
        <UiLabelValue :label="t('compression')" :value="compression" />
        <UiLabelValue :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.offlineBackup" />
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('shorter-backup-reports')">
          <template #value>
            <VtsEnabledState :enabled="settings.backupReportTpl ? settings.backupReportTpl === 'compactMjml' : false" />
          </template>
        </UiLabelValue>
        <UiLabelValue :label="t('merge-backups-synchronously')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.mergeBackupsSynchronously" />
          </template>
        </UiLabelValue>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSettingsUtils } from '@/composables/xo-backup-job-settings.composable'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const {
  maxExportRate,
  formattedTimeout,
  compression,
  proxy,
  settings,
  reportWhenValueTranslation,
  snapshotModeTranslation,
} = useXoBackupJobSettingsUtils(() => backupJob)
</script>
