import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useUnselectAfterDelete } from '@core/composables/unselect-after-delete.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupJobDelete(rawBackupJobs: MaybeRefOrGetter<FrontAnyXoBackupJob[]>) {
  const backupJobs = toComputed(rawBackupJobs)

  const { t } = useI18n()

  const { unselectIfDeleted } = useUnselectAfterDelete()

  const {
    run,
    canRun: canDeleteBackupJobs,
    isRunning: isDeletingBackupJobs,
    errorMessage: deleteBackupJobsErrorMessage,
  } = useXoBackupJobDeleteJob(backupJobs)

  function runDelete() {
    const backupJobIds = backupJobs.value.map(backupJob => backupJob.id)

    run({
      detached: true,
      onSuccess: results => {
        unselectIfDeleted(backupJobIds, results)
      },
    })
  }

  const { open: openDeleteModal } = useDeleteModal()

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

  function deleteBackupJobs() {
    const count = backupJobs.value.length

    if (count === 1) {
      return openDeleteModal({
        props: {
          accent: 'danger',
          subject: backupJobs.value[0].name ?? t('untitled'),
          description: t('modal:backup-job-delete-message', { n: 1 }),
          confirmLabel: t('action:delete-n-jobs', { n: 1 }),
        },
        events: {
          onConfirm: runDelete,
        },
      })
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:backup-job-delete-title', { n: count }),
        description: t('modal:backup-job-delete-message', { n: count }),
        confirmationText: t('n-jobs', { n: count }),
        confirmLabel: t('action:delete-n-jobs', { n: count }),
      },
      events: {
        onConfirm: runDelete,
      },
    })
  }

  return {
    deleteBackupJobs,
    canDeleteBackupJobs,
    isDeletingBackupJobs,
    deleteBackupJobsErrorMessage,
  }
}
