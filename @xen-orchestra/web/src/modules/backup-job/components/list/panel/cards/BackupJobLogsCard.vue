<template>
  <UiPanelCard class="backup-job-logs-card">
    <UiPanelCardTitle size="medium" :label="t('last-n-runs', { n: RUNS_COUNT })" />
    <div class="content">
      <template v-for="index in RUNS_COUNT" :key="index">
        <VtsDivider v-if="index > 1" class="divider" type="stretch" />
        <UiPanelCardTitle size="small" :label="t('last-run-number', { n: index })" />
        <BackupRunItem v-if="backupLogs[index - 1]" :backup-run="backupLogs[index - 1]" />
        <span v-else class="no-run typo-body-regular-small">{{ t('no-run') }}</span>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import BackupRunItem from '@/modules/backup-job/components/list/panel/card-items/BackupRunItem.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupLogs: FrontXoBackupLog[]
}>()

const RUNS_COUNT = 3

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
