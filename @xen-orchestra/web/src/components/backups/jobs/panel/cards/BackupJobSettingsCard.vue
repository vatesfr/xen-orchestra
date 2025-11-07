<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('settings') }}
    </UiCardTitle>
    <div class="content">
      <!-- Known settings -->
      <UiLabelValue v-if="proxy !== undefined" :label="t('proxy')" :value="proxy.name" ellipsis />
      <UiLabelValue
        v-if="settings.reportWhen !== undefined"
        :label="t('report-when')"
        :value="reportWhenValueTranslation"
        ellipsis
      />
      <UiLabelValue v-if="settings.backupReportTpl !== undefined" :label="t('shorter-backup-reports')" ellipsis>
        <template #value>
          <VtsStatus :status="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.hideSuccessfulItems !== undefined" :label="t('hide-successful-items')" ellipsis>
        <template #value>
          <VtsStatus :status="!!settings.hideSuccessfulItems" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="settings.concurrency !== undefined"
        :label="t('concurrency')"
        :value="String(settings.concurrency)"
      />
      <UiLabelValue v-if="nbdConcurrency !== undefined" :label="t('nbd-concurrency')" :value="String(nbdConcurrency)" />
      <UiLabelValue v-if="cbtDestroySnapshotData !== undefined" :label="t('cbt-destroy-snapshot-data')">
        <template #value>
          <VtsStatus :status="cbtDestroySnapshotData" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="maxExportRate !== undefined"
        :label="t('speed-limit')"
        :value="`${maxExportRate.value} ${maxExportRate.prefix}`"
        ellipsis
      />
      <UiLabelValue v-if="settings.checkpointSnapshot !== undefined" :label="t('checkpoint-snapshot')" ellipsis>
        <template #value>
          <VtsStatus :status="!!settings.checkpointSnapshot" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="settings.nRetriesVmBackupFailures !== undefined"
        :label="t('vm-backup-failure-number-of-retries')"
        :value="String(settings.nRetriesVmBackupFailures)"
      />
      <UiLabelValue v-if="compression !== undefined" :label="t('compression')" :value="compression" ellipsis />
      <UiLabelValue v-if="settings.offlineBackup !== undefined" :label="t('offline-backup')" ellipsis>
        <template #value>
          <VtsStatus :status="!!settings.offlineBackup" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.offlineSnapshot !== undefined" :label="t('offline-snapshot')" ellipsis>
        <template #value>
          <VtsStatus :status="!!settings.offlineSnapshot" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="settings.mergeBackupsSynchronously !== undefined"
        :label="t('merge-backups-synchronously')"
        ellipsis
      >
        <template #value>
          <VtsStatus :status="!!settings.mergeBackupsSynchronously" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.timezone" :label="t('timezone')" :value="settings.timezone" ellipsis />
      <template v-if="settings.reportRecipients && settings.reportRecipients.length > 0">
        <UiLabelValue :label="t('report-recipients')">
          <!-- TODO: use UiCollapsibleList when VtsCardRowKeyValue is updated -->
          <template #value>
            <div class="report-recipients">
              <div v-for="recipient in settings.reportRecipients" :key="recipient" class="recipient">
                <span v-tooltip class="text-ellipsis">
                  {{ recipient }}
                </span>
              </div>
            </div>
          </template>
        </UiLabelValue>
      </template>
      <UiLabelValue v-if="formattedTimeout !== undefined" :label="t('timeout')" ellipsis>
        <template #value>{{ formattedTimeout }}</template>
      </UiLabelValue>
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
import { useXoBackupJobSettingsUtils } from '@/composables/xo-backup-job-settings.composable'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
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

  .report-recipients {
    width: 100%;

    .recipient {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      width: 100%;
    }
  }
}
</style>
