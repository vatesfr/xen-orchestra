<template>
  <VtsSidePanel :has-selection="!!backupJob" @close="emit('close')">
    <template v-if="backupJob" #default>
      <BackupJobInfosCard :backup-job />
      <BackupJobSchedulesCard v-if="schedules.length > 0" :schedules />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoScheduleCollection } from '@/modules/backup-job/remote-resources/use-xo-schedule-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob?: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  close: []
}>()

const { schedulesByJobId } = useXoScheduleCollection()

const schedules = computed(() => (backupJob !== undefined ? (schedulesByJobId.value.get(backupJob.id) ?? []) : []))
</script>
