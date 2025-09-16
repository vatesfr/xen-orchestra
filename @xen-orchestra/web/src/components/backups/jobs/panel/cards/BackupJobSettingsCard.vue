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
          <VtsEnabledState :enabled="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.hideSuccessfulItems !== undefined">
        <template #key>{{ t('hide-successful-items') }}</template>
        <template #value>
          <VtsEnabledState :enabled="!!settings.hideSuccessfulItems" />
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
          <VtsEnabledState :enabled="cbtDestroySnapshotData" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.maxExportRate !== undefined">
        <template #key>{{ t('speed-limit') }}</template>
        <template #value>{{ `${maxExportRate?.value} ${maxExportRate?.prefix}` }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.checkpointSnapshot !== undefined">
        <template #key>{{ t('checkpoint-snapshot') }}</template>
        <template #value>
          <VtsEnabledState :enabled="!!settings.checkpointSnapshot" />
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
          <VtsEnabledState :enabled="!!settings.offlineBackup" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.offlineSnapshot !== undefined">
        <template #key>{{ t('offline-snapshot') }}</template>
        <template #value>
          <VtsEnabledState :enabled="!!settings.offlineSnapshot" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.mergeBackupsSynchronously !== undefined">
        <template #key>{{ t('merge-backups-synchronously') }}</template>
        <template #value>
          <VtsEnabledState :enabled="!!settings.mergeBackupsSynchronously" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="settings.timezone">
        <template #key>{{ t('timezone') }}</template>
        <template #value>{{ settings.timezone }}</template>
      </VtsCardRowKeyValue>
      <template v-if="settings.reportRecipients && settings.reportRecipients.length > 0">
        <VtsCardRowKeyValue v-for="(recipient, index) in settings.reportRecipients" :key="index">
          <template #key>
            <div v-if="index === 0">{{ t('report-recipients') }}</div>
          </template>
          <!-- TODO: use UiCollapsibleList when VtsCardRowKeyValue is updated -->
          <template #value>{{ recipient }}</template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-if="settings.timeout">
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
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoProxyCollection } from '@/remote-resources/use-xo-proxy-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useMapper } from '@core/packages/mapper'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { formatTimeout } from '@core/utils/time.util.ts'
import { reactiveComputed } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
}>()

const { t, locale } = useI18n()

const { useGetProxyById } = useXoProxyCollection()

type ReportWhen = 'always' | 'failure' | 'error' | 'never'

const settings = reactiveComputed(() => {
  if (!backupJob.settings['']) {
    return {}
  }

  const {
    preferNbd,
    cbtDestroySnapshotData,
    concurrency,
    nbdConcurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    timezone,
    reportRecipients,
    ...other
  } = backupJob.settings['']

  return {
    compression: backupJob.compression,
    proxy: backupJob.proxy,
    preferNbd,
    cbtDestroySnapshotData,
    concurrency,
    nbdConcurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    timezone,
    reportRecipients: reportRecipients as string[],
    other,
  }
})

const proxy = useGetProxyById(settings.proxy)

const reportWhenValueTranslation = useMapper<ReportWhen, string>(
  () => settings.reportWhen as ReportWhen | undefined,
  {
    always: t('report-when.always'),
    failure: t('report-when.skipped-and-failure'),
    error: t('report-when.error'),
    never: t('report-when.never'),
  },
  'never'
)

const nbdConcurrency = computed(() => (settings.preferNbd ? (settings.nbdConcurrency ?? 1) : undefined))

const cbtDestroySnapshotData = computed(() =>
  !!settings.preferNbd && settings.cbtDestroySnapshotData !== undefined ? settings.cbtDestroySnapshotData : undefined
)

const maxExportRate = computed(() => (settings.maxExportRate ? formatSpeedRaw(settings.maxExportRate) : undefined))

const formattedTimeout = computed(() => formatTimeout(Number(settings.timeout), locale.value))

const compression = computed(() => {
  if (backupJob.compression === undefined) {
    return undefined
  }

  if (backupJob.compression === 'native') {
    return 'GZIP'
  }

  return backupJob.compression
})
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
