<template>
  <VtsContentSidePanel class="backups">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs="vmBackupJobs" :busy="!areVmBackupJobsReady" :error="hasVmBackupJobFetchError" />
    </UiCard>
    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup/components/jobs/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup/components/jobs/panel/BackupJobSidePanel.vue'
import {
  useXoBackupJobCollection,
  type FrontXoVmBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const {
  backupJobs: vmBackupJobs,
  areBackupJobsReady: areVmBackupJobsReady,
  hasBackupJobFetchError: hasVmBackupJobFetchError,
} = useXoBackupJobCollection({}, () => vm.id)

const selectedBackupJob = useRouteQuery<FrontXoVmBackupJob | undefined>('id', {
  toData: id => vmBackupJobs.value.find(backupJob => backupJob.id === id),
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
