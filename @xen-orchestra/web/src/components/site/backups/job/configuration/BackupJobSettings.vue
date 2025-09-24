<template>
  <UiCard class="backup-job-settings">
    <UiTitle> {{ t('settings') }} </UiTitle>
    <span>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('proxy')" :value="backupJob.proxy" />
        <VtsQuickInfoRow :label="t('snapshot-mode')">
          <template #value>
            <UiTag variant="secondary" accent="info">{{ backupJob.mode }}</UiTag>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow
          :label="t('number-retries-vm-fails')"
          :value="backupJob.settings[''].nRetriesVmBackupFailures?.toString()"
        />
        <VtsQuickInfoRow :label="t('timeout')" :value="backupJob.settings[''].timeout?.toString()" />
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('speed-limit')" :value="backupJob.settings[''].maxExportRate?.toString()" />
        <VtsQuickInfoRow :label="t('report-when')" :value="backupJob.settings[''].reportWhen" />
        <VtsQuickInfoRow :label="t('report-recipients')">
          <template #value>
            <UiTag
              v-for="(recipient, index) in backupJob.settings[''].reportRecipients"
              :key="index"
              variant="secondary"
              accent="info"
            >
              {{ recipient }}
            </UiTag>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('concurrency')" :value="backupJob.settings[''].concurrency?.toString()" />
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('compression')" :value="backupJob.compression" />
        <VtsQuickInfoRow :label="t('offline-backup')">
          <template #value>
            <VtsEnabledState :enabled="backupJob.settings[''].offlineBackup ?? false" />
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('shorter-backup-reports')" :value="backupJob.settings[''].reportWhen" />
        <VtsQuickInfoRow :label="t('merge-backups-synchronously')">
          <template #value>
            <VtsEnabledState :enabled="backupJob.settings[''].mergeBackupsSynchronously ?? false" />
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
    </span>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-settings {
  width: 100%;
  span {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
