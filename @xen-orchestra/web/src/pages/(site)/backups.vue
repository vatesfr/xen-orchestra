<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :has-error="hasFetchError" />
    </UiCard>
    <BackupJobsSidePanel
      v-if="selectedBackupJob"
      :backup-job="selectedBackupJob"
      @close="selectedBackupJob = undefined"
    />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/components/backups/jobs/BackupJobsTable.vue'
import BackupJobsSidePanel from '@/components/backups/jobs/panel/BackupJobsSidePanel.vue'
import { useXoBackupJobCollection, type XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()

const { backupJobs, hasFetchError } = useXoBackupJobCollection()

const selectedBackupJob = useRouteQuery<XoBackupJob | undefined>('id', {
  toData: id => backupJobs.value.find(backupJob => backupJob.id === id),
  toQuery: backupJob => backupJob?.id ?? '',
})
</script>

<style scoped lang="postcss">
.backups {
  &:not(.mobile) {
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
