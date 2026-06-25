<template>
  <VtsSidePanel :has-selection="!!backupJob" @close="emit('close')">
    <template v-if="backupJob">
      <BackupJobInfosCard :backup-job />
      <BackupJobSchedulesCard :backup-job-schedules />
      <BackupJobLogsCard v-if="lastThreeLogs.length > 0" :backup-logs="lastThreeLogs" />
      <BackupJobBackedUpVmsCard v-if="backupJob.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
      <BackupJobBackedUpPoolsCard v-if="backedUpPools.length > 0" :backed-up-pools />
      <BackupJobSourceRepositoryCard v-if="backupJob.type === 'mirrorBackup'" :mirror-backup-job="backupJob" />
      <BackupJobTargetsCard :storage-repository-targets :backup-repository-targets />
      <BackupJobSettingsCard v-if="hasSettings" :backup-job />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import BackupJobInfosCard from '@/modules/backup/components/jobs/panel/cards/BackupJobInfosCard.vue'
import BackupJobSettingsCard from '@/modules/backup/components/jobs/panel/cards/BackupJobSettingsCard.vue'
import BackupJobBackedUpPoolsCard from '@/modules/backup/components/panel/cards/BackupJobBackedUpPoolsCard.vue'
import BackupJobBackedUpVmsCard from '@/modules/backup/components/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobLogsCard from '@/modules/backup/components/panel/cards/BackupJobLogsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup/components/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSourceRepositoryCard from '@/modules/backup/components/panel/cards/BackupJobSourceRepositoryCard.vue'
import BackupJobTargetsCard from '@/modules/backup/components/panel/cards/BackupJobTargetsCard.vue'
import { getMetadataBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-metadata-backup-job-settings'
import { getMirrorBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-mirror-backup-job-settings'
import { getVmBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-vm-backup-job-settings'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { extractIdsFromSimplePattern } from '@/shared/utils/pattern.util.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import type { XoSr, XoPool, XoBackupRepository } from '@vates/types'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob?: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  close: []
}>()

const { getSrsByIds } = useXoSrCollection()
const { getBackupRepositoriesByIds } = useXoBackupRepositoryCollection()
const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
const { schedulesByJobId } = useXoScheduleCollection()
const { getPoolsByIds } = useXoPoolCollection()

const backupJobSchedules = computed(() =>
  backupJob !== undefined ? (schedulesByJobId.value.get(backupJob.id) ?? []) : []
)

const lastThreeLogs = computed(() => (backupJob !== undefined ? getLastNBackupLogsByJobId(backupJob.id) : []))

const backedUpPools = computed(() => {
  if (backupJob?.type !== 'metadataBackup' || backupJob.pools === undefined) {
    return []
  }

  return getPoolsByIds(extractIdsFromSimplePattern(backupJob.pools) as XoPool['id'][])
})

const backupRepositoryTargets = computed(() =>
  backupJob !== undefined
    ? getBackupRepositoriesByIds(extractIdsFromSimplePattern(backupJob.remotes) as XoBackupRepository['id'][])
    : []
)

const storageRepositoryTargets = computed(() => {
  if (!(backupJob?.type === 'backup' && backupJob.srs)) {
    return []
  }

  return getSrsByIds(extractIdsFromSimplePattern(backupJob.srs) as XoSr['id'][])
})

const hasSettings = computed(() => {
  if (backupJob === undefined) {
    return false
  }

  const settings =
    backupJob.type === 'backup'
      ? getVmBackupJobSettings(backupJob)
      : backupJob.type === 'metadataBackup'
        ? getMetadataBackupJobSettings(backupJob)
        : getMirrorBackupJobSettings(backupJob)

  return Object.values(settings).some(value => value !== undefined)
})
</script>
