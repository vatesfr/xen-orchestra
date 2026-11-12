<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
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
