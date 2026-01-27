<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('settings') }}
    </UiCardTitle>
    <div class="content">
      <!-- Known settings -->
      <VtsCardRowKeyValue v-if="proxy !== undefined">
        <template #key>{{ t('proxy') }}</template>
        <template #value>{{ proxy.name }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.reportWhen !== undefined">
        <template #key>{{ t('report-when') }}</template>
        <template #value>{{ reportWhenValueTranslation }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.backupReportTpl !== undefined">
        <template #key>{{ t('shorter-backup-reports') }}</template>
        <template #value>
          <VtsStatus :status="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.hideSuccessfulItems !== undefined">
        <template #key>{{ t('hide-successful-items') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.hideSuccessfulItems" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.concurrency !== undefined">
        <template #key>{{ t('concurrency') }}</template>
        <template #value>{{ settings.concurrency }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="nbdConcurrency !== undefined">
        <template #key>{{ t('nbd-concurrency') }}</template>
        <template #value>{{ nbdConcurrency }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="cbtDestroySnapshotData !== undefined">
        <template #key>{{ t('cbt-destroy-snapshot-data') }}</template>
        <template #value>
          <VtsStatus :status="cbtDestroySnapshotData" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="maxExportRate !== undefined">
        <template #key>{{ t('speed-limit') }}</template>
        <template #value>{{ `${maxExportRate.value} ${maxExportRate.prefix}` }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.checkpointSnapshot !== undefined">
        <template #key>{{ t('checkpoint-snapshot') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.checkpointSnapshot" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.nRetriesVmBackupFailures !== undefined">
        <template #key>{{ t('vm-backup-failure-number-of-retries') }}</template>
        <template #value>{{ settings.nRetriesVmBackupFailures }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="compression !== undefined">
        <template #key>{{ t('compression') }}</template>
        <template #value>{{ compression }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.offlineBackup !== undefined">
        <template #key>{{ t('offline-backup') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.offlineBackup" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.offlineSnapshot !== undefined">
        <template #key>{{ t('offline-snapshot') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.offlineSnapshot" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.mergeBackupsSynchronously !== undefined">
        <template #key>{{ t('merge-backups-synchronously') }}</template>
        <template #value>
          <VtsStatus :status="!!settings.mergeBackupsSynchronously" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.timezone">
        <template #key>{{ t('timezone') }}</template>
        <template #value>{{ settings.timezone }}</template>
      </VtsCardRowKeyValue>
      <template v-if="settings.reportRecipients && settings.reportRecipients.length > 0">
        <VtsCardRowKeyValue v-for="(recipient, index) in settings.reportRecipients" :key="index">
          <template #key>
            <template v-if="index === 0">{{ t('report-recipients') }}</template>
          </template>
          <!-- TODO: use UiCollapsibleList when VtsCardRowKeyValue is updated -->
          <template #value>{{ recipient }}</template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-if="formattedTimeout !== undefined">
        <template #key>{{ t('timeout') }}</template>
        <template #value>{{ formattedTimeout }}</template>
      </VtsCardRowKeyValue>

      <!-- Settings rest -->
      <UiLogEntryViewer
        v-if="settings.other && Object.keys(settings.other).length > 0"
        :content="settings.other"
        :label="t('other-settings')"
        size="small"
        accent="info"
      />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupJobSettingsUtils } from '@/modules/backup/composables/backup-job-settings/xo-backup-job-settings.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { AnyXoBackupJob } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: AnyXoBackupJob
}>()

const { t } = useI18n()

const {
  cbtDestroySnapshotData,
  compression,
  formattedTimeout,
  maxExportRate,
  nbdConcurrency,
  proxy,
  reportWhenValueTranslation,
  settings,
} = useXoBackupJobSettingsUtils(() => backupJob)
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
