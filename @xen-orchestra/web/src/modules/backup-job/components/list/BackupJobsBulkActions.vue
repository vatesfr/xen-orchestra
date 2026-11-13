<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs } = defineProps<{
  backupJobs: FrontAnyXoBackupJob[]
}>()

const { t } = useI18n()

const {
  run: enableBackupJobs,
  canRun: canEnableBackupJobs,
  isRunning: isEnablingBackupJobs,
  errorMessage: enableBackupJobsErrorMessage,
} = useXoBackupJobChangeStateJob(() => backupJobs, true)

const {
  run: disableBackupJobs,
  canRun: canDisableBackupJobs,
  isRunning: isDisablingBackupJobs,
  errorMessage: disableBackupJobsErrorMessage,
} = useXoBackupJobChangeStateJob(() => backupJobs, false)

const {
  run: runBackupJobs,
  canRun: canRunBackupJobs,
  isRunning: isRunningBackupJobs,
  errorMessage: runBackupJobsErrorMessage,
} = useXoBackupJobRunJob(() => backupJobs)

const {
  run: duplicateBackupJobs,
  canRun: canDuplicateBackupJobs,
  isRunning: isDuplicatingBackupJobs,
  errorMessage: duplicateBackupJobsErrorMessage,
} = useXoBackupJobDuplicateJob(() => backupJobs)

const { deleteBackupJobs, canDeleteBackupJobs, isDeletingBackupJobs, deleteBackupJobsErrorMessage } =
  useBackupJobDelete(() => backupJobs)

const isSelectionEmpty = computed(() => backupJobs.length === 0)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:change-state'),
    icon: 'action:change-state',
    disabled: isSelectionEmpty.value,
    hint: isSelectionEmpty.value ? t('no-backup-job-selected') : undefined,
    children: [
      {
        label: t('action:enable'),
        icon: 'status:success-circle',
        onClick: () => enableBackupJobs(),
        disabled: !canEnableBackupJobs.value,
        busy: isEnablingBackupJobs.value,
        hint: enableBackupJobsErrorMessage.value,
      },
      {
        label: t('action:disable'),
        icon: 'action:disable',
        onClick: () => disableBackupJobs(),
        disabled: !canDisableBackupJobs.value,
        busy: isDisablingBackupJobs.value,
        hint: disableBackupJobsErrorMessage.value,
      },
    ],
  },
  {
    label: t('action:manual-run'),
    icon: 'fa:play',
    onClick: () => runBackupJobs(),
    disabled: !canRunBackupJobs.value,
    busy: isRunningBackupJobs.value,
    hint: isSelectionEmpty.value ? t('no-backup-job-selected') : runBackupJobsErrorMessage.value,
  },
  {
    label: t('action:duplicate'),
    icon: 'action:duplicate',
    onClick: () => duplicateBackupJobs(),
    disabled: !canDuplicateBackupJobs.value,
    busy: isDuplicatingBackupJobs.value,
    hint: isSelectionEmpty.value ? t('no-backup-job-selected') : duplicateBackupJobsErrorMessage.value,
  },
  {
    label: t('action:delete'),
    icon: 'action:delete',
    onClick: () => deleteBackupJobs(),
    disabled: !canDeleteBackupJobs.value,
    busy: isDeletingBackupJobs.value,
    hint: isSelectionEmpty.value ? t('no-backup-job-selected') : deleteBackupJobsErrorMessage.value,
    accent: 'danger',
  },
])
</script>
