<template>
  <UiDrawer @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-backup-job') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { EditBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  confirm: [payload: EditBackupJobPayload]
  cancel: []
}>()

const { t } = useI18n()
</script>
