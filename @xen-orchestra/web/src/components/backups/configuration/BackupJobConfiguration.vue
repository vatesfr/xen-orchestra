<template>
  <span class="backup-job-configuration">
    <BackupJobGeneralInformation :backup-job />
    <BackupJobsSettings :backup-job />
    <BackupJobSchedules :backup-jobs="backupJobsForSchedule" />
  </span>
</template>

<script setup lang="ts">
import BackupJobGeneralInformation from '@/components/backups/configuration/BackupJobGeneralInformation.vue'
import BackupJobSchedules from '@/components/backups/configuration/BackupJobSchedules.vue'
import BackupJobsSettings from '@/components/backups/configuration/BackupJobSettings.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { backupJobs } = useXoBackupJobCollection()
const backupJobsForSchedule = computed(() => {
  return backupJobs.value.filter(backup => backup.id === backupJob.id)
})
</script>

<style lang="postcss" scoped>
.backup-job-configuration {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.8rem;
}
</style>
