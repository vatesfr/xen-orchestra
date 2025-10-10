<template>
  <div class="backup-jobs-configuration">
    <BackupJobsGeneralInformation :backup-job />
    <BackupJobsSettings :backup-job />
    <BackupJobsSchedules :backup-jobs="backupJobsSchedules" />
  </div>
</template>

<script setup lang="ts">
import BackupJobsSettings from '@/components/backups/configuration/BackupJobSettings.vue'
import BackupJobsGeneralInformation from '@/components/backups/configuration/BackupJobsGeneralInformation.vue'
import BackupJobsSchedules from '@/components/backups/configuration/BackupJobsSchedules.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()
const { backupJobs } = useXoBackupJobCollection()

const backupJobsSchedules = computed(() => {
  return backupJobs.value.filter(backup => backup.id === backupJob.id)
})
</script>

<style lang="postcss" scoped>
.backup-jobs-configuration {
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
