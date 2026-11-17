<template>
  <VtsActionButton
    :hint="editBackupJobErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:edit"
    :disabled="!canEditBackupJob"
    :busy="isEditingBackupJob"
    @click="editBackupJob()"
  >
    {{ t('action:edit') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useEditBackupJob } from '@/modules/backup-job/composables/use-edit-backup-job.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const { editBackupJob, canEditBackupJob, isEditingBackupJob, editBackupJobErrorMessage } = useEditBackupJob(
  () => backupJob
)
</script>
