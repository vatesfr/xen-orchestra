<template>
  <span class="backed-up-vm">
    <BackedUpVmsConfiguration v-if="backupJob.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
    <BackedUpVmsRuns v-if="backupJob.type === 'backup' && backupJob.vms" :backup-logs :backed-up-vms="backupJob.vms" />
  </span>
</template>

<script setup lang="ts">
import BackedUpVmsConfiguration from '@/components/backups/backed-up-vms/backedUpVmsConfiguration.vue'
import BackedUpVmsRuns from '@/components/backups/backed-up-vms/backedUpVmsRuns.vue'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
}>()

const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()

const backupLogs = computed(() => getLastNBackupLogsByJobId(backupJob.id, 1) ?? [])
</script>
