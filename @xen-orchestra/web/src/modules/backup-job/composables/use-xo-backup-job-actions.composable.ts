import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { isBackupJobEnabled } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobActions(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t } = useI18n()

  const { schedulesByJobId } = useXoScheduleCollection()

  const isEnabled = computed(() => isBackupJobEnabled(schedulesByJobId.value.get(backupJob.value.id) ?? []))

  const {
    run: changeBackupJobsState,
    canRun: canChangeBackupJobsState,
    isRunning: isChangingBackupJobsState,
    errorMessage: changeBackupJobsStateErrorMessage,
  } = useXoBackupJobChangeStateJob(
    () => [backupJob.value],
    () => !isEnabled.value
  )

  const {
    run: runBackupJobs,
    canRun: canRunBackupJobs,
    isRunning: isRunningBackupJobs,
    errorMessage: runBackupJobsErrorMessage,
  } = useXoBackupJobRunJob(() => [backupJob.value])

  const {
    run: duplicateBackupJobs,
    canRun: canDuplicateBackupJobs,
    isRunning: isDuplicatingBackupJobs,
    errorMessage: duplicateBackupJobsErrorMessage,
  } = useXoBackupJobDuplicateJob(() => [backupJob.value])

  const { deleteBackupJobs, canDeleteBackupJobs, isDeletingBackupJobs, deleteBackupJobsErrorMessage } =
    useBackupJobDelete(() => [backupJob.value])

  const changeStateAction = computed(
    (): LeafActionItem => ({
      label: isEnabled.value ? t('action:disable') : t('action:enable'),
      icon: isEnabled.value ? 'action:disable' : 'status:success-circle',
      onClick: () => changeBackupJobsState(),
      disabled: !canChangeBackupJobsState.value,
      busy: isChangingBackupJobsState.value,
      hint: changeBackupJobsStateErrorMessage.value,
    })
  )

  const manualRunAction = computed(
    (): LeafActionItem => ({
      label: t('action:manual-run'),
      icon: 'fa:play',
      onClick: () => runBackupJobs(),
      disabled: !canRunBackupJobs.value,
      busy: isRunningBackupJobs.value,
      hint: runBackupJobsErrorMessage.value,
    })
  )

  const duplicateAction = computed(
    (): LeafActionItem => ({
      label: t('action:duplicate'),
      icon: 'action:duplicate',
      onClick: () => duplicateBackupJobs(),
      disabled: !canDuplicateBackupJobs.value,
      busy: isDuplicatingBackupJobs.value,
      hint: duplicateBackupJobsErrorMessage.value,
    })
  )

  const deleteAction = computed(
    (): LeafActionItem => ({
      label: t('action:delete'),
      icon: 'action:delete',
      accent: 'danger',
      separator: true,
      onClick: () => deleteBackupJobs(),
      disabled: !canDeleteBackupJobs.value,
      busy: isDeletingBackupJobs.value,
      hint: deleteBackupJobsErrorMessage.value,
    })
  )

  const moreActions = computed(() => [changeStateAction.value, manualRunAction.value, duplicateAction.value])

  return { isEnabled, changeStateAction, manualRunAction, duplicateAction, deleteAction, moreActions }
}
