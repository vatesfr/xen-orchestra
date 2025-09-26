<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs="vmBackupJobs" :has-error="hasVmBackupJobFetchError" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/components/backups/jobs/BackupJobsTable.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { XoVm } from '@/types/xo/vm.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

const { vm } = defineProps<{
  vm: XoVm
}>()

const uiStore = useUiStore()

const { backupJobs: vmBackupJobs, hasBackupJobFetchError: hasVmBackupJobFetchError } = useXoBackupJobCollection(
  {},
  () => vm.id
)
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
