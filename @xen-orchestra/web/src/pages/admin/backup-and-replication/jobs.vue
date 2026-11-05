<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupJobsTable :backup-jobs :busy="!areBackupJobsReady" :error="hasBackupJobFetchError" />
      </UiCard>
    </div>

    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import {
  type FrontAnyXoBackupJob,
  useXoBackupJobCollection,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
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
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
