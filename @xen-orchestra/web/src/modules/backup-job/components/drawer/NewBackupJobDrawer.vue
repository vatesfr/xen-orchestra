<template>
  <UiDrawer @confirm="next()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:create-new-backup-job') }}
    </template>

    <template #content>
      <UiStepper ref="stepper" :steps :current-step="currentStepIndex">
        <BackupJobSourceStep v-if="currentStep === 'source'" :form="source" />
        <BackupJobTransferStep
          v-else-if="currentStep === 'transfer'"
          :bindings="transfer.bindings"
          :is-incremental
          :is-mirror
        />
        <BackupJobTargetStep v-else-if="currentStep === 'target'" :form="target" />
        <BackupJobPlanningStep
          v-else-if="currentStep === 'planning'"
          :bindings="planning.bindings"
          :is-metadata="source.formData.dataSource === 'metadata'"
        />
        <BackupJobReviewStep
          v-else-if="currentStep === 'review'"
          :source
          :transfer="source.formData.dataSource === 'metadata' ? undefined : transfer"
          :target
          :planning
          @edit="step => goToStep(step)"
        />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep !== 'source'" @click="back()">
        {{ t('action:back') }}
      </VtsOverlayCancelButton>
      <VtsOverlayCancelButton v-else @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ currentStep === 'review' ? t('action:create') : t('action:continue') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import { useNewBackupJobForm } from '@/modules/backup-job/form/new/use-new-backup-job-form.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const {
  source,
  transfer,
  target,
  planning,
  isIncremental,
  isMirror,
  currentStep,
  currentStepIndex,
  steps,
  next,
  back,
  goToStep,
} = useNewBackupJobForm()

const stepper = useTemplateRef('stepper')

watch(currentStepIndex, () => stepper.value?.$el.scrollIntoView({ block: 'start' }))
</script>
