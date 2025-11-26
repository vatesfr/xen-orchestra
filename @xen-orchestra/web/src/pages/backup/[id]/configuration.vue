<template>
  <div class="backup-job-configuration">
    <BackupJobGeneralInformation :backup-job />
    <BackupJobSettings :backup-job />
    <BackupJobSchedulesTable :backup-job-schedules :is-ready="areSchedulesReady" :has-error="hasScheduleFetchError" />
  </div>
</template>

<script setup lang="ts">
import BackupJobGeneralInformation from '@/components/backups/configuration/BackupJobGeneralInformation.vue'
import BackupJobSchedulesTable from '@/components/backups/configuration/BackupJobSchedulesTable.vue'
import BackupJobSettings from '@/components/backups/configuration/BackupJobSettings.vue'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import type { XoVmBackupJob } from '@vates/types'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { schedulesByJobId, areSchedulesReady, hasScheduleFetchError } = useXoScheduleCollection()

const backupJobSchedules = computed(() => schedulesByJobId.value.get(backupJob.id) ?? [])
</script>

<style lang="postcss" scoped>
.backup-job-configuration {
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
