<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('settings')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('proxy') }}</template>
        <template #value>{{ proxy?.name }}</template>
        <template v-if="proxy !== undefined" #addons>
          <VtsCopyButton :value="proxy.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="isVmBackupJob">
        <template #key>{{ t('snapshot-mode') }}</template>
        <template #value>
          <UiTag accent="info" variant="secondary">{{ snapshotModeTranslation }}</UiTag>
        </template>
        <template #addons>
          <VtsCopyButton :value="snapshotModeTranslation" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="hasTransferSettings">
        <VtsCardRowKeyValue>
          <template #key>{{ t('vm-backup-failure-number-of-retries') }}</template>
          <template #value>{{ settings.nRetriesVmBackupFailures }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('timeout') }}</template>
          <template #value>{{ formattedTimeout }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('speed-limit') }}</template>
          <template #value>{{ formattedMaxExportRate }}</template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue>
        <template #key>{{ t('report-when') }}</template>
        <template #value>{{ reportWhenValueTranslation }}</template>
        <template #addons>
          <VtsCopyButton :value="reportWhenValueTranslation" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue :values="reportRecipients" :max-visible-values="VISIBLE_REPORT_RECIPIENTS_COUNT" align-top>
        <template #key>{{ t('report-recipients') }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="hasTransferSettings">
        <template #key>{{ t('concurrency') }}</template>
        <template #value>{{ settings.concurrency }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="canSetCompression">
        <template #key>{{ t('compression') }}</template>
        <template #value>
          <template v-if="compression !== undefined">{{ compression }}</template>
          <VtsStatus v-else :status="false" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="canSetOfflineBackup">
        <template #key>{{ t('offline-backup') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.offlineBackup" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('shorter-backup-reports') }}</template>
        <template #value>
          <VtsStatus :status="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="hasTransferSettings">
        <template #key>{{ t('merge-backups-synchronously') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.mergeBackupsSynchronously" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupJobSettings } from '@/modules/backup-job/composables/use-xo-backup-job-settings.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { hasBackupJobSnapshotRetention } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const VISIBLE_REPORT_RECIPIENTS_COUNT = 5

const { t } = useI18n()

const {
  compression,
  formattedTimeout,
  formattedMaxExportRate,
  proxy,
  reportWhenValueTranslation,
  settings,
  snapshotModeTranslation,
} = useXoBackupJobSettings(() => backupJob)

const isVmBackupJob = computed(() => backupJob.type === 'backup')

const hasTransferSettings = computed(() => backupJob.type === 'backup' || backupJob.type === 'mirrorBackup')

const canSetCompression = computed(() => backupJob.type === 'backup' && backupJob.mode === 'full')

const canSetOfflineBackup = computed(() => backupJob.type === 'backup' && !hasBackupJobSnapshotRetention(backupJob))

const reportRecipients = computed(() => settings.reportRecipients ?? [])
</script>
