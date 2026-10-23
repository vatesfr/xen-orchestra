<template>
  <UiDrawer @confirm="next()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:create-new-job') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="currentStepIndex">
        <BackupJobSourceStep v-if="currentStep === 'source'" :bindings="source.bindings" />
        <BackupJobTransferStep v-else-if="currentStep === 'transfer'" :bindings="transfer.bindings" />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep !== 'source'" @click="back()">
        {{ t('action:back') }}
      </VtsOverlayCancelButton>
      <VtsOverlayCancelButton v-else @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:continue') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import { useNewBackupJobForm } from '@/modules/backup-job/form/new/use-new-backup-job-form.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const { source, transfer, currentStep, currentStepIndex, steps, next, back } = useNewBackupJobForm()
</script>
