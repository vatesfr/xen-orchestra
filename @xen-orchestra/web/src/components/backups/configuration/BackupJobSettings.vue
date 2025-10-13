<template>
  <UiCard>
    <UiTitle> {{ t('settings') }} </UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('proxy')" :value="backupJob.proxy" />
        <VtsQuickInfoRow :label="t('snapshot-mode')">
          <template v-if="backupJob.mode" #value>
            <UiTag variant="secondary" accent="info">{{ backupJob.mode }}</UiTag>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('vm-backup-failure-number-of-retries')" :value="settings.nRetriesVmBackupFailures" />
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
        <VtsQuickInfoRow :label="t('concurrency')" :value="nbdConcurrency" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('compression')" :value="compression" />
        <VtsQuickInfoRow :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="settings.offlineBackup ?? false" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('shorter-backup-reports')">
          <template #value>
            <VtsEnabledState :enabled="settings.backupReportTpl ?? false" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('merge-backups-synchronously')">
          <template #value>
            <VtsEnabledState :enabled="settings.mergeBackupsSynchronously ?? false" />
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useMapper } from '@core/packages/mapper'
import { formatSpeedRaw } from '@core/utils/speed.util'
import { formatTimeout } from '@core/utils/time.util'
import { reactiveComputed } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t, locale } = useI18n()

const settings = reactiveComputed(() => {
  if (!backupJob.settings['']) {
    return {}
  }

  const {
    proxy,
    mode,
    nRetriesVmBackupFailures,
    timeout,
    maxExportRate,
    reportWhen,
    reportRecipients,
    backupReportTpl,
    concurrency,
    compression,
    offlineBackup,
    mergeBackupsSynchronously,
    cbtDestroySnapshotData,
    preferNbd,
    nbdConcurrency,
    ...other
  } = backupJob.settings['']

  return {
    proxy,
    mode,
    nRetriesVmBackupFailures: nRetriesVmBackupFailures ? String(nRetriesVmBackupFailures) : undefined,
    timeout: timeout ? String(timeout) : undefined,
    maxExportRate,
    reportWhen,
    reportRecipients,
    backupReportTpl: backupReportTpl ? backupReportTpl === 'compactMjml' : false,
    concurrency: concurrency ? String(concurrency) : undefined,
    compression,
    offlineBackup,
    mergeBackupsSynchronously,
    cbtDestroySnapshotData,
    preferNbd,
    nbdConcurrency,
    other,
  }
})

type ReportWhen = 'always' | 'failure' | 'error' | 'never'

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
