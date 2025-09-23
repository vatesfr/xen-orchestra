<template>
  <span class="backup-job-configuration">
    <BackupJobGeneralInformation :backup-job />
    <BackupJobsSettings :backup-job />
  </span>
</template>

<script setup lang="ts">
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import BackupJobGeneralInformation from './BackupJobGeneralInformation.vue'
import BackupJobsSettings from './BackupJobSettings.vue'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()
</script>

<style lang="postcss" scoped>
.backup-job-configuration {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.8rem;
}
</style>
