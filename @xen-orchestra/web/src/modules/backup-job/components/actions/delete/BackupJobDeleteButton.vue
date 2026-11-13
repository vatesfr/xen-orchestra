<template>
  <VtsDeleteButton
    :hint="deleteBackupJobsErrorMessage"
    :disabled="!canDeleteBackupJobs"
    :busy="isDeletingBackupJobs"
    @click="deleteBackupJobs()"
  />
</template>

<script lang="ts" setup>
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { deleteBackupJobs, canDeleteBackupJobs, isDeletingBackupJobs, deleteBackupJobsErrorMessage } =
  useBackupJobDelete(() => [backupJob])
</script>
