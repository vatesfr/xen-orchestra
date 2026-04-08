<template>
  <UiCard>
    <UiTitle>{{ t('settings') }}</UiTitle>
    <VtsColumns>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('proxy')" :value="proxy?.name" />
        <VtsTabularKeyValueRow :label="t('snapshot-mode')">
          <template v-if="backupJob.mode" #value>
            <UiTag variant="secondary" accent="info">{{ snapshotModeTranslation }}</UiTag>
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow
          :label="t('vm-backup-failure-number-of-retries')"
          :value="
            settings.nRetriesVmBackupFailures !== undefined ? String(settings.nRetriesVmBackupFailures) : undefined
          "
        />
        <VtsTabularKeyValueRow :label="t('timeout')" :value="formattedTimeout" />
      </VtsTabularKeyValueList>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow
          :label="t('speed-limit')"
          :value="maxExportRate ? `${maxExportRate.value} ${maxExportRate.prefix}` : undefined"
        />
        <VtsTabularKeyValueRow :label="t('report-when')" :value="reportWhenValueTranslation" />
        <VtsTabularKeyValueRow :label="t('report-recipients')">
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
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow
          :label="t('concurrency')"
          :value="settings.concurrency !== undefined ? String(settings.concurrency) : undefined"
        />
      </VtsTabularKeyValueList>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('compression')" :value="compression" />
        <VtsTabularKeyValueRow :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.offlineBackup" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('shorter-backup-reports')">
          <template #value>
            <VtsEnabledState :enabled="settings.backupReportTpl ? settings.backupReportTpl === 'compactMjml' : false" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('merge-backups-synchronously')">
          <template #value>
            <VtsEnabledState :enabled="!!settings.mergeBackupsSynchronously" />
          </template>
        </VtsTabularKeyValueRow>
      </VtsTabularKeyValueList>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupJobSettingsUtils } from '@/modules/backup/composables/backup-job-settings/xo-backup-job-settings.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
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
