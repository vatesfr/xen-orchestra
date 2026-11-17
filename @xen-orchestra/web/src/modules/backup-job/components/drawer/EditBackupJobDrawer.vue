<template>
  <UiDrawer class="edit-backup-job-drawer" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-backup-job') }}
    </template>

    <template #content>
      <div class="section">
        <UiTitle>{{ t('source') }}</UiTitle>
        <BackupJobSourceStep :form="source" />
      </div>
      <div v-if="!isMetadata" class="section">
        <UiTitle>{{ t('transfer') }}</UiTitle>
        <BackupJobTransferStep :bindings="transfer.bindings" :is-incremental :is-mirror />
      </div>
      <div class="section">
        <UiTitle>{{ t('target') }}</UiTitle>
        <BackupJobTargetStep :form="target" />
      </div>
      <div class="section">
        <UiTitle>{{ t('planning') }}</UiTitle>
        <BackupJobPlanningStep :bindings="planning.bindings" :is-metadata />
      </div>
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
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import { useEditBackupJobForm } from '@/modules/backup-job/form/edit/use-edit-backup-job-form.ts'
import type { EditBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { backupJob, schedule } = defineProps<{
  backupJob: FrontAnyXoBackupJob
  schedule: FrontXoSchedule
}>()

const emit = defineEmits<{
  confirm: [payload: EditBackupJobPayload]
  cancel: []
}>()

const { t } = useI18n()

const { source, transfer, target, planning, isIncremental, isMirror, isMetadata } = useEditBackupJobForm(
  backupJob,
  schedule
)
</script>

<style lang="postcss" scoped>
.edit-backup-job-drawer {
  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    text-align: start;

    & + .section {
      margin-block-start: 4.8rem;
    }
  }
}
</style>
