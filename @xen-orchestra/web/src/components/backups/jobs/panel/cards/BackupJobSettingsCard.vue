<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('settings') }}
    </UiCardTitle>
    <div class="content">
      <!-- Known settings -->
      <UiLabelValue v-if="proxy !== undefined" :label="t('proxy')" :value="proxy.name" />
      <UiLabelValue
        v-if="settings.reportWhen !== undefined"
        :label="t('report-when')"
        :value="reportWhenValueTranslation"
      />
      <UiLabelValue v-if="settings.backupReportTpl !== undefined" :label="t('shorter-backup-reports')">
        <template #value>
          <VtsEnabledState :enabled="settings.backupReportTpl === 'compactMjml'" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.hideSuccessfulItems !== undefined" :label="t('hide-successful-items')">
        <template #value>
          <VtsEnabledState :enabled="!!settings.hideSuccessfulItems" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.concurrency !== undefined" :label="t('concurrency')" :value="settings.concurrency" />
      <UiLabelValue v-if="nbdConcurrency !== undefined" :label="t('nbd-concurrency')" :value="nbdConcurrency" />
      <UiLabelValue v-if="cbtDestroySnapshotData !== undefined" :label="t('cbt-destroy-snapshot-data')">
        <template #value>
          <VtsEnabledState :enabled="cbtDestroySnapshotData" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="maxExportRate !== undefined"
        :label="t('speed-limit')"
        :value="`${maxExportRate.value} ${maxExportRate.prefix}`"
      />
      <UiLabelValue v-if="settings.checkpointSnapshot !== undefined" :label="t('checkpoint-snapshot')">
        <template #value>
          <VtsEnabledState :enabled="!!settings.checkpointSnapshot" />
        </template>
      </UiLabelValue>
      <UiLabelValue
        v-if="settings.nRetriesVmBackupFailures !== undefined"
        :label="t('vm-backup-failure-number-of-retries')"
        :value="settings.nRetriesVmBackupFailures"
      />
      <UiLabelValue v-if="compression !== undefined" :label="t('compression')" :value="compression" />
      <UiLabelValue v-if="settings.offlineBackup !== undefined" :label="t('offline-backup')">
        <template #value>
          <VtsEnabledState :enabled="!!settings.offlineBackup" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.offlineSnapshot !== undefined" :label="t('offline-snapshot')">
        <template #value>
          <VtsEnabledState :enabled="!!settings.offlineSnapshot" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.mergeBackupsSynchronously !== undefined" :label="t('merge-backups-synchronously')">
        <template #value>
          <VtsEnabledState :enabled="!!settings.mergeBackupsSynchronously" />
        </template>
      </UiLabelValue>
      <UiLabelValue v-if="settings.timezone" :label="t('timezone')" :value="settings.timezone" />
      <UiLabelValue :label="t('report-recipients')" :value="settings.reportRecipients">
        <!-- TODO: use UiCollapsibleList when VtsCardRowKeyValue is updated -->
      </UiLabelValue>
      <UiLabelValue v-if="formattedTimeout !== undefined" :label="t('timeout')">
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
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoProxyCollection } from '@/remote-resources/use-xo-proxy-collection.ts'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
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
    concurrency: concurrency ? String(concurrency) : undefined,
    nbdConcurrency,
    maxExportRate,
    nRetriesVmBackupFailures: nRetriesVmBackupFailures ? String(nRetriesVmBackupFailures) : undefined,
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

const proxy = useGetProxyById(() => settings.proxy)

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

const nbdConcurrency = computed(() => (settings.preferNbd ? String(settings.nbdConcurrency ?? 1) : undefined))

const cbtDestroySnapshotData = computed(() =>
  !!settings.preferNbd && settings.cbtDestroySnapshotData !== undefined ? settings.cbtDestroySnapshotData : undefined
)

const maxExportRate = computed(() => (settings.maxExportRate ? formatSpeedRaw(settings.maxExportRate) : undefined))

const formattedTimeout = computed(() =>
  settings.timeout !== undefined ? formatTimeout(Number(settings.timeout), locale.value) : undefined
)

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
