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
      </div>
    </template>
    <template #default>
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
  </UiPanel>
</template>

<script setup lang="ts">
import BackupLogInfosCard from '@/components/backups/logs/panel/cards/BackupLogInfosCard.vue'
import BackupLogResultsCard, {
  type BackupLogResultType,
} from '@/components/backups/logs/panel/cards/BackupLogResultsCard.vue'
import BackupJobBackedUpPoolsCard from '@/components/backups/panel/cards/BackupJobBackedUpPoolsCard.vue'
import BackupJobBackedUpVmsCard from '@/components/backups/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobSchedulesCard from '@/components/backups/panel/cards/BackupJobSchedulesCard.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import type { XoPool } from '@/types/xo/pool.type'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import { getTasksResultsRecursively } from '@/utils/xo-records/task.util'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: XoBackupLog
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { useGetBackupJobById } = useXoBackupJobCollection()
const { schedulesByJobId } = useXoScheduleCollection()
const { getPoolsByIds } = useXoPoolCollection()

const backupJob = useGetBackupJobById(() => backupLog.jobId)

const backupJobSchedules = computed(() =>
  backupJob.value ? (schedulesByJobId.value.get(backupJob.value.id) ?? []) : []
)

const backedUpPools = computed(() => {
  if (backupJob.value?.type !== 'metadataBackup' || backupJob.value?.pools === undefined) {
    return []
  }

  return getPoolsByIds(extractIdsFromSimplePattern(backupJob.value.pools) as XoPool['id'][])
})

const backupLogResults = computed(() => {
  if (backupLog.tasks === undefined) {
    return undefined
  }

  return {
    info: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'info')),
    warning: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'warning')),
    error: backupLog.tasks.flatMap(task => getTasksResultsRecursively(task, 'failure')),
  }
})
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
