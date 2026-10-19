<template>
  <VtsSidePanel :has-selection="!!backupJob" @close="emit('close')">
    <template v-if="backupJob" #default>
      <UiAlert v-if="schedules.length > 1" accent="warning">
        {{ t('multiple-schedules') }}
        <template #description>{{ t('multiple-schedules-advice') }}</template>
      </UiAlert>
      <BackupJobInfosCard :backup-job />
      <BackupJobSchedulesCard v-if="schedules.length > 0" :schedules />
      <BackupJobLogsCard v-if="lastBackupLogs.length > 0" :backup-logs="lastBackupLogs" />
      <BackupJobBackedUpVmsCard v-if="backupJob.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
      <BackupJobTargetsCard :storage-repository-targets :backup-repository-targets />
      <BackupJobSettingsCard :backup-job />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import BackupJobLogsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobLogsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSettingsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSettingsCard.vue'
import BackupJobTargetsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobTargetsCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/backup-job/remote-resources/use-xo-schedule-collection.ts'
import {
  useXoBackupRepositoryCollection,
  type FrontXoBackupRepository,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob?: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { schedulesByJobId } = useXoScheduleCollection()

const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()

const { getSrsByIds } = useXoSrCollection()

const { getBackupRepositoriesByIds } = useXoBackupRepositoryCollection()

const schedules = computed(() => (backupJob !== undefined ? (schedulesByJobId.value.get(backupJob.id) ?? []) : []))

const lastBackupLogs = computed(() => (backupJob !== undefined ? getLastNBackupLogsByJobId(backupJob.id) : []))

const backupRepositoryTargets = computed(() =>
  backupJob !== undefined
    ? getBackupRepositoriesByIds(extractIdsFromSimplePattern<FrontXoBackupRepository['id']>(backupJob.remotes))
    : []
)

const storageRepositoryTargets = computed(() => {
  if (!(backupJob?.type === 'backup' && backupJob.srs)) {
    return []
  }

  return getSrsByIds(extractIdsFromSimplePattern<FrontXoSr['id']>(backupJob.srs))
})
</script>
