<template>
  <div class="backed-up-vms">
    <BackedUpVmsConfiguration :backup-job />
    <BackedUpVmsTable :backup-job :busy="!areBackupJobsReady" :error="hasBackupJobFetchError" />
  </div>
</template>

<script setup lang="ts">
import BackedUpVmsConfiguration from '@/modules/backup/components/backed-up-vms/BackedUpVmsConfiguration.vue'
import BackedUpVmsTable from '@/modules/backup/components/backed-up-vms/BackedUpVmsTable.vue'
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { XoVmBackupJob } from '@vates/types'

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
