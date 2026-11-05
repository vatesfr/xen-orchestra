<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupJobsTable :backup-jobs="vmBackupJobs" :busy="!areVmBackupJobsReady" :error="hasVmBackupJobFetchError" />
      </UiCard>
    </div>

    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoVmBackupJobCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-jobs-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { vmBackupJobs, areVmBackupJobsReady, hasVmBackupJobFetchError } = useXoVmBackupJobCollection({}, () => vm.id)

const selectedBackupJob = useRouteQuery<FrontXoVmBackupJob | undefined>('id', {
  toData: id => vmBackupJobs.value.find(backupJob => backupJob.id === id),
  toQuery: backupJob => backupJob?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
