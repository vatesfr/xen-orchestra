<template>
  <VtsSidePanel :selected="!!backupLog" :closable="!!backupLog" @close="emit('close')">
    <template #default>
      <VtsStateHero v-if="!backupLog" format="panel" type="no-selection" size="medium" />
      <template v-else>
        <BackupLogInfosCard :backup-log />
        <BackupJobSchedulesCard :backup-job-schedules />
        <template v-if="backupLogResults !== undefined">
          <template v-for="[type, data] of Object.entries(backupLogResults)" :key="type">
            <BackupLogResultsCard v-if="data.length > 0" :results="data" :type="type as BackupLogResultType" />
          </template>
        </template>
        <BackupJobBackedUpVmsCard v-if="backupJob?.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
        <BackupJobBackedUpPoolsCard v-if="backedUpPools.length > 0" :backed-up-pools />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import BackupLogInfosCard from '@/modules/backup/components/logs/panel/cards/BackupLogInfosCard.vue'
import BackupLogResultsCard, {
  type BackupLogResultType,
} from '@/modules/backup/components/logs/panel/cards/BackupLogResultsCard.vue'
import BackupJobBackedUpPoolsCard from '@/modules/backup/components/panel/cards/BackupJobBackedUpPoolsCard.vue'
import BackupJobBackedUpVmsCard from '@/modules/backup/components/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup/components/panel/cards/BackupJobSchedulesCard.vue'
import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { getTasksResultsRecursively } from '@/modules/task/utils/xo-task.util.ts'
import { extractIdsFromSimplePattern } from '@/shared/utils/pattern.util.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { XoPool } from '@vates/types'
import { computed } from 'vue'

const { backupLog } = defineProps<{
  backupLog?: FrontXoBackupLog
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetBackupJobById } = useXoBackupJobCollection()
const { schedulesByJobId } = useXoScheduleCollection()
const { getPoolsByIds } = useXoPoolCollection()

const backupJob = useGetBackupJobById(() => backupLog?.jobId)

const backupJobSchedules = computed(() =>
  backupJob.value ? (schedulesByJobId.value.get(backupJob.value.id) ?? []) : []
)

const backedUpPools = computed(() => {
  if (backupJob.value?.type !== 'metadataBackup' || backupJob.value.pools === undefined) {
    return []
  }

  return getPoolsByIds(extractIdsFromSimplePattern(backupJob.value.pools) as XoPool['id'][])
})

const backupLogResults = computed(() => {
  if (backupLog?.tasks === undefined) {
    return undefined
  }

  return {
    info: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'info')),
    warning: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'warning')),
    error: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'failure')),
  }
})
</script>
