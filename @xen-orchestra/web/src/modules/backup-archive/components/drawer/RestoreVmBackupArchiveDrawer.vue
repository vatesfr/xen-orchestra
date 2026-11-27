<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:restore-vm-backup') }}
    </template>

    <template #content>
      <div class="restore-vm-backup-archive-drawer">
        <VmBackupArchiveRestoreSummary :backup-archive />
        <UiStepper ref="stepper" :steps :current-step="currentStepIndex">
          <div class="step">
            <VtsRequiredHint v-if="currentStep !== 'review'" class="required-hint" />
            <VmBackupArchiveRestoreTypeStep v-if="currentStep === 'restore-type'" v-bind="bindings.restoreType" />
            <template v-else-if="currentStep === 'options'">
              <VmBackupArchiveRestoreCopyStep v-if="formData.restoreType === 'copy'" :form="copy" />
              <VmBackupArchiveRestoreLiveStep v-else-if="formData.restoreType === 'live'" :form="live" />
              <VmBackupArchiveRestoreAttachDiskStep
                v-else-if="formData.restoreType === 'attach-disk'"
                :form="attachDisk"
              />
              <VmBackupArchiveRestoreDownloadFilesStep
                v-else-if="formData.restoreType === 'download-files'"
                :form="downloadFiles"
              />
              <VmBackupArchiveRestoreExportDiskStep
                v-else-if="formData.restoreType === 'export-disk'"
                :form="exportDisk"
              />
              <VmBackupArchiveRestoreExportVmStep v-else-if="formData.restoreType === 'export-vm'" :form="exportVm" />
            </template>
            <VmBackupArchiveRestoreReviewStep
              v-else
              :restore-type-label="restoreTypeLabel ?? ''"
              @edit="goToStep('restore-type')"
            >
              <VmBackupArchiveRestoreCopyReview
                v-if="formData.restoreType === 'copy'"
                :form="copy"
                @edit="goToStep('options')"
              />
              <VmBackupArchiveRestoreLiveReview
                v-else-if="formData.restoreType === 'live'"
                :form="live"
                @edit="goToStep('options')"
              />
              <VmBackupArchiveRestoreDownloadFilesReview
                v-else-if="formData.restoreType === 'download-files'"
                :form="downloadFiles"
                @edit="goToStep('options')"
              />
              <VmBackupArchiveRestoreExportDiskReview
                v-else-if="formData.restoreType === 'export-disk'"
                :form="exportDisk"
                @edit="goToStep('options')"
              />
              <VmBackupArchiveRestoreExportVmReview
                v-else-if="formData.restoreType === 'export-vm'"
                :form="exportVm"
                @edit="goToStep('options')"
              />
            </VmBackupArchiveRestoreReviewStep>
          </div>
        </UiStepper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep !== 'restore-type'" @click="back()">
        {{ t('action:back') }}
      </VtsOverlayCancelButton>
      <VtsOverlayCancelButton v-else @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ confirmLabel }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreCopyReview from '@/modules/backup-archive/components/form/review/VmBackupArchiveRestoreCopyReview.vue'
import VmBackupArchiveRestoreDownloadFilesReview from '@/modules/backup-archive/components/form/review/VmBackupArchiveRestoreDownloadFilesReview.vue'
import VmBackupArchiveRestoreExportDiskReview from '@/modules/backup-archive/components/form/review/VmBackupArchiveRestoreExportDiskReview.vue'
import VmBackupArchiveRestoreExportVmReview from '@/modules/backup-archive/components/form/review/VmBackupArchiveRestoreExportVmReview.vue'
import VmBackupArchiveRestoreLiveReview from '@/modules/backup-archive/components/form/review/VmBackupArchiveRestoreLiveReview.vue'
import VmBackupArchiveRestoreAttachDiskStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreAttachDiskStep.vue'
import VmBackupArchiveRestoreCopyStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreCopyStep.vue'
import VmBackupArchiveRestoreDownloadFilesStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreDownloadFilesStep.vue'
import VmBackupArchiveRestoreExportDiskStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreExportDiskStep.vue'
import VmBackupArchiveRestoreExportVmStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreExportVmStep.vue'
import VmBackupArchiveRestoreLiveStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreLiveStep.vue'
import VmBackupArchiveRestoreReviewStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreReviewStep.vue'
import VmBackupArchiveRestoreTypeStep from '@/modules/backup-archive/components/form/steps/VmBackupArchiveRestoreTypeStep.vue'
import VmBackupArchiveRestoreSummary from '@/modules/backup-archive/components/form/VmBackupArchiveRestoreSummary.vue'
import { useRestoreVmBackupArchiveForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-form.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { unrefElement } from '@vueuse/core'
import { useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const {
  formData,
  bindings,
  copy,
  live,
  attachDisk,
  downloadFiles,
  exportDisk,
  exportVm,
  restoreTypeLabel,
  currentStep,
  currentStepIndex,
  steps,
  confirmLabel,
  goToStep,
  next,
  back,
} = useRestoreVmBackupArchiveForm(() => backupArchive)

const stepper = useTemplateRef('stepper')

watch(currentStepIndex, () => unrefElement(stepper)?.scrollIntoView())

async function handleConfirm() {
  await next()
}
</script>

<style lang="postcss" scoped>
.restore-vm-backup-archive-drawer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .step {
    display: flex;
    flex-direction: column;
    gap: 4.8rem;
  }

  .required-hint {
    margin-block-end: -3.2rem;
  }
}
</style>
