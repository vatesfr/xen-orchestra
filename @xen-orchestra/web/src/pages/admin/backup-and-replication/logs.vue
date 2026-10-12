<template>
  <div class="container">
    <UiCard>
      <AdminBackupLogsTable :backup-logs :busy="!areBackupLogsReady" :error="hasBackupLogFetchError" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupLogCollection } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import AdminBackupLogsTable from '@/modules/backup-log/components/list/BackupLogsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'

const { backupLogs, areBackupLogsReady, hasBackupLogFetchError } = useXoBackupLogCollection()
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
