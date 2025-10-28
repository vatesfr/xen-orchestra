<template>
  <div class="backed-up-vms">
    <BackedUpVmsConfiguration :backup-job />
    <BackedUpVmsTable :backup-job :is-ready="areBackupJobsReady" :has-error="hasBackupJobFetchError" />
  </div>
</template>

<script setup lang="ts">
import BackedUpVmsConfiguration from '@/components/backups/backed-up-vms/BackedUpVmsConfiguration.vue'
import BackedUpVmsTable from '@/components/backups/backed-up-vms/BackedUpVmsTable.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()
</script>

<style lang="postcss" scoped>
.backed-up-vms {
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
