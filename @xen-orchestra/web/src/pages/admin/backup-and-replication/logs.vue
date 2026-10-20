<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupLogsTable :backup-logs :busy="!areBackupLogsReady" :error="hasBackupLogFetchError" />
      </UiCard>
    </div>

    <BackupLogSidePanel :backup-log="selectedBackupLog" @close="selectedBackupLog = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupLogsTable from '@/modules/backup-log/components/list/BackupLogsTable.vue'
import BackupLogSidePanel from '@/modules/backup-log/components/list/panel/BackupLogSidePanel.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { backupLogs, areBackupLogsReady, hasBackupLogFetchError, getBackupLogById } = useXoBackupLogCollection()

const selectedBackupLog = useRouteQuery<FrontXoBackupLog | undefined>('id', {
  toData: id => getBackupLogById(id as FrontXoBackupLog['id']),
  toQuery: backupLog => backupLog?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
