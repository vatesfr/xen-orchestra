<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-backup-job') }}
    </template>

    <template #content>
      <EditBackupJobForm
        ref="form"
        :key="currentStep"
        :applied-form-data-set
        :schedule-id="schedule.id"
        :step="currentStep"
        :has-removed-target-backup-repository
        @edit="step => openStep(step)"
      />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="handleCancel()" />
      <VtsOverlayConfirmButton>
        {{ currentStep === 'review' ? t('action:save') : t('action:apply') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import EditBackupJobForm from '@/modules/backup-job/components/form/edit/EditBackupJobForm.vue'
import { useEditBackupJobSteps } from '@/modules/backup-job/form/edit/use-edit-backup-job-steps.ts'
import type { EditBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef, watch } from 'vue'
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

const { appliedFormDataSet, currentStep, hasRemovedTargetBackupRepository, openStep, cancelStep, applyStep } =
  useEditBackupJobSteps(backupJob, schedule)

const form = useTemplateRef('form')

watch(currentStep, () => form.value?.$el.scrollIntoView(), { flush: 'post' })

function handleCancel() {
  if (currentStep.value === 'review') {
    emit('cancel')
    return
  }

  cancelStep()
}

async function handleConfirm() {
  const step = currentStep.value

  if (step !== 'review') {
    const formDataSet = await form.value?.validateStepAndCopyFormDataSet(step)

    if (formDataSet !== undefined) {
      applyStep(formDataSet)
    }

    return
  }

  const payload = await form.value?.validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>
