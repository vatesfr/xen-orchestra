<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <BackupJobInfosCard :backup-job />
      <BackupJobSchedulesCard :backup-job-schedules />
      <BackupJobLogsCard v-if="lastThreeLogs.length > 0" :backup-logs="lastThreeLogs" />
      <BackupJobBackedUpVmsCard v-if="backupJob.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
      <BackupJobBackedUpPoolsCard v-if="backedUpPools.length > 0" :backed-up-pools />
      <BackupJobSourceRepositoryCard v-if="backupJob.type === 'mirrorBackup'" :mirror-backup-job="backupJob" />
      <BackupJobTargetsCard :storage-repository-targets :backup-repository-targets />
      <BackupJobSettingsCard v-if="hasSettings" :backup-job />
    </template>
  </UiPanel>
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
import { useXoBackupJobSettingsUtils } from '@/modules/backup/composables/backup-job-settings/xo-backup-job-settings.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection'
import { useXoBackupLogCollection } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { extractIdsFromSimplePattern } from '@/shared/utils/pattern.util.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoSr, XoPool, XoBackupRepository } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { getSrsByIds } = useXoSrCollection()
const { getBackupRepositoriesByIds } = useXoBackupRepositoryCollection()
const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
const { schedulesByJobId } = useXoScheduleCollection()
const { getPoolsByIds } = useXoPoolCollection()

const backupJobSchedules = computed(() => schedulesByJobId.value.get(backupJob.id) ?? [])

const lastThreeLogs = computed(() => getLastNBackupLogsByJobId(backupJob.id))

const backedUpPools = computed(() => {
  if (backupJob.type !== 'metadataBackup' || backupJob.pools === undefined) {
    return []
  }

  return getPoolsByIds(extractIdsFromSimplePattern(backupJob.pools) as XoPool['id'][])
})

const backupRepositoryTargets = computed(() =>
  getBackupRepositoriesByIds(extractIdsFromSimplePattern(backupJob.remotes) as XoBackupRepository['id'][])
)

const storageRepositoryTargets = computed(() => {
  if (!(backupJob.type === 'backup' && backupJob.srs)) {
    return []
  }

  return getSrsByIds(extractIdsFromSimplePattern(backupJob.srs) as XoSr['id'][])
})

const { settings: backupJobSettings } = useXoBackupJobSettingsUtils(() => backupJob)

const hasSettings = computed(() => Object.values(backupJobSettings).some(value => value !== undefined))
</script>

<style scoped lang="postcss">
.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
