<template>
  <UiPanelCard class="backup-job-logs-card">
    <UiPanelCardTitle size="medium" :label="t('last-n-runs', { n: BACKUP_JOB_LAST_RUNS_COUNT })" />
    <div class="content">
      <template v-for="index in BACKUP_JOB_LAST_RUNS_COUNT" :key="index">
        <VtsDivider v-if="index > 1" class="divider" type="stretch" />
        <UiPanelCardTitle size="small" :label="t('last-run-number', { n: index })" />
        <BackupJobRunItem v-if="backupLogs[index - 1]" :backup-run="backupLogs[index - 1]" />
        <span v-else class="no-run typo-body-regular-small">{{ t('no-run') }}</span>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import BackupJobRunItem from '@/modules/backup-job/components/list/panel/card-items/BackupJobRunItem.vue'
import { BACKUP_JOB_LAST_RUNS_COUNT } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupLogs: FrontXoBackupLog[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.backup-job-logs-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .divider {
      margin-block: 1.6rem;
    }

    .no-run {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
