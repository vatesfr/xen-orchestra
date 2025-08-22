<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :has-error="hasFetchError" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/components/site/backups/BackupJobsTable.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()

const { backupJobs, hasFetchError } = useXoBackupJobCollection()
</script>

<style scoped lang="postcss">
.backups {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
