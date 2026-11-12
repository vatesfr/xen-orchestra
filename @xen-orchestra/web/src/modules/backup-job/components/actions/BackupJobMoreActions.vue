<template>
  <VtsActionItems :actions="moreActions" />
</template>

<script lang="ts" setup>
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { isBackupJobEnabled } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const { schedulesByJobId } = useXoScheduleCollection()

const isEnabled = computed(() => isBackupJobEnabled(schedulesByJobId.value.get(backupJob.id) ?? []))

const {
  run: changeBackupJobsState,
  canRun: canChangeBackupJobsState,
  isRunning: isChangingBackupJobsState,
  errorMessage: changeBackupJobsStateErrorMessage,
} = useXoBackupJobChangeStateJob(
  () => [backupJob],
  () => !isEnabled.value
)

const {
  run: runBackupJobs,
  canRun: canRunBackupJobs,
  isRunning: isRunningBackupJobs,
  errorMessage: runBackupJobsErrorMessage,
} = useXoBackupJobRunJob(() => [backupJob])

const {
  run: duplicateBackupJobs,
  canRun: canDuplicateBackupJobs,
  isRunning: isDuplicatingBackupJobs,
  errorMessage: duplicateBackupJobsErrorMessage,
} = useXoBackupJobDuplicateJob(() => [backupJob])

const moreActions = computed<ActionItem[]>(() => [
  {
    label: isEnabled.value ? t('action:disable') : t('action:enable'),
    icon: isEnabled.value ? 'action:disable' : 'status:success-circle',
    onClick: () => changeBackupJobsState(),
    disabled: !canChangeBackupJobsState.value,
    busy: isChangingBackupJobsState.value,
    hint: changeBackupJobsStateErrorMessage.value,
  },
  {
    label: t('action:manual-run'),
    icon: 'fa:play',
    onClick: () => runBackupJobs(),
    disabled: !canRunBackupJobs.value,
    busy: isRunningBackupJobs.value,
    hint: runBackupJobsErrorMessage.value,
  },
  {
    label: t('action:duplicate'),
    icon: 'action:duplicate',
    onClick: () => duplicateBackupJobs(),
    disabled: !canDuplicateBackupJobs.value,
    busy: isDuplicatingBackupJobs.value,
    hint: duplicateBackupJobsErrorMessage.value,
  },
])
</script>
