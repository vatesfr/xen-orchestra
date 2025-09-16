<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
        <div v-if="uiStore.isMobile" class="action-buttons">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            variant="tertiary"
            size="medium"
            accent="brand"
            left-icon="fa:edit"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            variant="tertiary"
            size="medium"
            accent="danger"
            left-icon="fa:trash"
          >
            {{ t('forget') }}
          </UiButton>
          <UiButtonIcon v-tooltip="t('coming-soon')" disabled accent="brand" size="medium" icon="fa:ellipsis" />
        </div>
      </div>
    </template>
    <template #default>
      <BackupJobInfosCard :backup-job />
      <BackupJobSchedulesCard :backup-job-schedules />
      <BackupJobLogsCard v-if="lastThreeLogs.length > 0" :backup-logs="lastThreeLogs" />
      <BackupJobsBackedUpVmsCard v-if="backupJob.type === 'backup' && backupJob.vms" :backed-up-vms="backupJob.vms" />
      <BackupJobsBackedUpPoolsCard v-if="backedUpPools.length > 0" :backed-up-pools />
      <BackupSourceRepositoryCard v-if="backupJob.type === 'mirrorBackup'" :mirror-backup-job="backupJob" />
      <BackupJobsTargetsCard :storage-repository-targets :backup-repository-targets />
      <BackupJobSettingsCard v-if="hasSettings" :backup-job />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import BackupJobInfosCard from '@/components/backups/jobs/panel/cards/BackupJobInfosCard.vue'
import BackupJobLogsCard from '@/components/backups/jobs/panel/cards/BackupJobLogsCard.vue'
import BackupJobsBackedUpPoolsCard from '@/components/backups/jobs/panel/cards/BackupJobsBackedUpPoolsCard.vue'
import BackupJobsBackedUpVmsCard from '@/components/backups/jobs/panel/cards/BackupJobsBackedUpVmsCard.vue'
import BackupJobSchedulesCard from '@/components/backups/jobs/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSettingsCard from '@/components/backups/jobs/panel/cards/BackupJobSettingsCard.vue'
import BackupJobsTargetsCard from '@/components/backups/jobs/panel/cards/BackupJobsTargetsCard.vue'
import BackupSourceRepositoryCard from '@/components/backups/jobs/panel/cards/BackupSourceRepositoryCard.vue'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection.ts'
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import type { XoBackupRepository } from '@/types/xo/br.type.ts'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type.ts'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
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

const hasSettings = computed(
  () => backupJob.compression !== undefined || backupJob.proxy !== undefined || backupJob.settings[''] !== undefined
)
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

.action-buttons {
  display: flex;
  align-items: center;
}
</style>
