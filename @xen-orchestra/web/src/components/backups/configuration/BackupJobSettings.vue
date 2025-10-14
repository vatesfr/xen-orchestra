<template>
  <UiCard>
    <UiTitle> {{ t('settings') }} </UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('proxy')" :value="proxy?.name" />
        <VtsQuickInfoRow :label="t('snapshot-mode')">
          <template v-if="backupJob.mode" #value>
            <UiTag variant="secondary" accent="info">{{ backupJob.mode }}</UiTag>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow
          :label="t('vm-backup-failure-number-of-retries')"
          :value="settings.nRetriesVmBackupFailures ? String(settings.nRetriesVmBackupFailures) : undefined"
        />
        <VtsQuickInfoRow :label="t('timeout')" :value="formattedTimeout" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow
          :label="t('speed-limit')"
          :value="exportRate ? `${exportRate.value} ${exportRate.prefix}` : undefined"
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
        <VtsQuickInfoRow :label="t('concurrency')" :value="nbdConcurrency ? String(nbdConcurrency) : undefined" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('compression')" :value="compressionLabel" />
        <VtsQuickInfoRow :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="settings.offlineBackup ?? false" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('shorter-backup-reports')">
          <template #value>
            <VtsEnabledState :enabled="settings.backupReportTpl ? settings.backupReportTpl === 'compactMjml' : false" />
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
import { useXoBackupJob } from '@/composables/xo-backup-job.composable'
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const { getExportRate, getNbdConcurrency, getFormattedTimeout, getCompressionLabel, getProxy, getsettings } =
  useXoBackupJob()

const settings = computed(() => getsettings(backupJob))

type ReportWhen = 'always' | 'failure' | 'error' | 'never'

const reportWhenValueTranslation = useMapper<ReportWhen, string>(
  () => settings.value.reportWhen as ReportWhen | undefined,
  {
    always: t('report-when.always'),
    failure: t('report-when.skipped-and-failure'),
    error: t('report-when.error'),
    never: t('report-when.never'),
  },
  'never'
)

const nbdConcurrency = computed(() => getNbdConcurrency(backupJob))
const exportRate = computed(() => getExportRate(settings.value.maxExportRate))
const formattedTimeout = computed(() => getFormattedTimeout(settings.value.timeout))
const compressionLabel = computed(() => getCompressionLabel(settings.value.compression))
const proxy = getProxy(backupJob)
</script>
