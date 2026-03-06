<template>
  <UiCard>
    <UiTitle>{{ t('settings') }}</UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('proxy')" :value="proxy?.name" />
        <VtsQuickInfoRow :label="t('snapshot-mode')">
          <template v-if="backupJob.mode" #value>
            <UiTag variant="secondary" accent="info">{{ snapshotModeTranslation }}</UiTag>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow
          :label="t('vm-backup-failure-number-of-retries')"
          :value="
            settings.nRetriesVmBackupFailures !== undefined ? String(settings.nRetriesVmBackupFailures) : undefined
          "
        />
        <VtsQuickInfoRow :label="t('timeout')" :value="formattedTimeout" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow
          :label="t('speed-limit')"
          :value="maxExportRate ? `${maxExportRate.value} ${maxExportRate.prefix}` : undefined"
        />
        <VtsQuickInfoRow :label="t('report-when')" :value="reportWhenValueTranslation" />
        <VtsQuickInfoRow :label="t('report-recipients')">
          <template #value>
            <UiTagsList v-if="settings.reportRecipients">
              <UiTag
                v-for="(recipient, index) in settings.reportRecipients"
                :key="index"
                variant="secondary"
                accent="info"
              >
                {{ recipient }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow
          :label="t('concurrency')"
          :value="settings.concurrency !== undefined ? String(settings.concurrency) : undefined"
        />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('compression')" :value="compression" />
        <VtsQuickInfoRow :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.offlineBackup" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('shorter-backup-reports')">
          <template #value>
            <VtsEnabledState :enabled="settings.backupReportTpl ? settings.backupReportTpl === 'compactMjml' : false" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('merge-backups-synchronously')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.mergeBackupsSynchronously" />
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSettingsUtils } from '@/modules/backup/composables/backup-job-settings/xo-backup-job-settings.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontXoVmBackupJob
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
