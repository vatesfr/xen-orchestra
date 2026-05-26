<template>
  <div class="backups" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :busy="!areBackupJobsReady" :error="hasBackupJobFetchError" />
    </UiCard>
    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup/components/jobs/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup/components/jobs/panel/BackupJobSidePanel.vue'
import {
  useXoBackupJobCollection,
  type FrontAnyXoBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'

const panelStore = usePanelStore()
const uiStore = useUiStore()

const { backupJobs, getBackupJobById, areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()

const selectedBackupJob = useRouteQuery<FrontAnyXoBackupJob | undefined>('id', {
  toData: id => getBackupJobById(id as FrontAnyXoBackupJob['id']),
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
