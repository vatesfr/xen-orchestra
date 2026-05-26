<template>
  <div class="backups" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs="vmBackupJobs" :busy="!areVmBackupJobsReady" :error="hasVmBackupJobFetchError" />
    </UiCard>
    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup/components/jobs/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup/components/jobs/panel/BackupJobSidePanel.vue'
import {
  useXoBackupJobCollection,
  type FrontXoVmBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const panelStore = usePanelStore()
const uiStore = useUiStore()

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
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
