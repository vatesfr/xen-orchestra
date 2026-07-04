<template>
  <VtsContentSidePanel class="backups">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :busy="!areBackupJobsReady" :error="hasBackupJobFetchError" />
    </UiCard>
    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup/components/jobs/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup/components/jobs/panel/BackupJobSidePanel.vue'
import {
  useXoBackupJobCollection,
  type FrontAnyXoBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { backupJobs, getBackupJobById, areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()

const selectedBackupJob = useRouteQuery<FrontAnyXoBackupJob | undefined>('id', {
  toData: id => getBackupJobById(id as FrontAnyXoBackupJob['id']),
  toQuery: backupJob => backupJob?.id ?? '',
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
