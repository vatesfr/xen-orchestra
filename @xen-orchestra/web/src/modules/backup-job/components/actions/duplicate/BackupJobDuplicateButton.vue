<template>
  <VtsActionButton
    :hint="duplicateBackupJobsErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:duplicate"
    :disabled="!canDuplicateBackupJobs"
    :busy="isDuplicatingBackupJobs"
    @click="duplicateBackupJobs()"
  >
    {{ t('action:duplicate') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const {
  run: duplicateBackupJobs,
  canRun: canDuplicateBackupJobs,
  isRunning: isDuplicatingBackupJobs,
  errorMessage: duplicateBackupJobsErrorMessage,
} = useXoBackupJobDuplicateJob(() => [backupJob])
</script>
