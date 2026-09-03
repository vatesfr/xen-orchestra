<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('create-new-br') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="currentStepIndex">
        <BackupRepositoryGeneralStep v-if="currentStep === 'general'" :bindings="general.bindings" />
        <BackupRepositoryDetailsStep v-else-if="currentStep === 'details'" :type="general.formData.type" :details />
        <NewBackupRepositoryReviewStep v-else :general :details :details-title="detailsStepLabel" @edit="goToStep" />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep !== 'general'" @click="back()">{{ t('back') }}</VtsOverlayCancelButton>
      <VtsOverlayCancelButton v-else @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ currentStep === 'review' ? t('action:create') : t('continue') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import BackupRepositoryDetailsStep from '@/modules/backup/components/repository/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup/components/repository/form/steps/BackupRepositoryGeneralStep.vue'
import NewBackupRepositoryReviewStep from '@/modules/backup/components/repository/form/steps/NewBackupRepositoryReviewStep.vue'
import { useNewBackupRepositoryForm } from '@/modules/backup/form/use-new-backup-repository-form.ts'
import type { NewBackupRepositoryPayload } from '@/modules/backup/jobs/xo-backup-repository-create.job.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: [payload: NewBackupRepositoryPayload]
  cancel: []
}>()

const { t } = useI18n()

const {
  general,
  details,
  currentStep,
  detailsStepLabel,
  currentStepIndex,
  steps,
  next,
  back,
  goToStep,
  validateAndBuildPayload,
} = useNewBackupRepositoryForm()

async function handleConfirm() {
  if (currentStep.value !== 'review') {
    await next()
    return
  }

  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>
