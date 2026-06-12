<template>
  <VtsContentSidePanel class="backups">
    <UiCard class="container">
      <BackupLogsTable :backup-logs :busy="!areBackupLogsReady" :error="hasBackupLogFetchError" />
    </UiCard>
    <BackupLogSidePanel :backup-log="selectedBackupLog" @close="selectedBackupLog = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupLogsTable from '@/modules/backup/components/logs/BackupLogsTable.vue'
import BackupLogSidePanel from '@/modules/backup/components/logs/panel/BackupLogSidePanel.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import {
  useXoBackupLogCollection,
  type FrontXoBackupLog,
} from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { backupLogsByJobId, hasBackupLogFetchError, areBackupLogsReady } = useXoBackupLogCollection()

const backupLogs = computed(() => backupLogsByJobId.value.get(backupJob.id) ?? [])

const selectedBackupLog = useRouteQuery<FrontXoBackupLog | undefined>('id', {
  toData: id => backupLogs.value.find(backupLog => backupLog.id === id),
  toQuery: backupLog => backupLog?.id ?? '',
})
</script>

<style scoped lang="postcss">
.backups {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
