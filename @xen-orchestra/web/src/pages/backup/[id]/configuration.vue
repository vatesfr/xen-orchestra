<template>
  <div class="backup-jobs-configuration">
    <BackupJobGeneralInformation :backup-job />
    <BackupJobSettings :backup-job />
    <BackupJobSchedules :backup-jobs-schedules />
  </div>
</template>

<script setup lang="ts">
import BackupJobGeneralInformation from '@/components/backups/configuration/BackupJobGeneralInformation.vue'
import BackupJobSchedules from '@/components/backups/configuration/BackupJobSchedules.vue'
import BackupJobSettings from '@/components/backups/configuration/BackupJobSettings.vue'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { schedulesByJobId } = useXoScheduleCollection()

const backupJobsSchedules = computed(() => schedulesByJobId.value.get(backupJob.id) ?? [])
</script>

<style lang="postcss" scoped>
.backup-jobs-configuration {
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
