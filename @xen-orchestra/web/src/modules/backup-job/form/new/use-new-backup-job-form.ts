import {
  createBackupJobFormDataSet,
  createPlanningFormData,
  createSourceFormData,
  createTargetBackupRepositoryFormData,
  createTargetHealthCheckFormData,
  createTargetStorageRepositoryFormData,
  createTransferFormData,
  useBackupJobFormBase,
} from '@/modules/backup-job/form/use-backup-job-form-base.ts'
import { watch } from 'vue'

export function useNewBackupJobForm() {
  const {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
    validateAndBuildPayload,
  } = useBackupJobFormBase(createBackupJobFormDataSet())

  watch(
    () => source.formData.dataSource,
    dataSource => {
      Object.assign(source.formData, {
        ...createSourceFormData(),
        name: source.formData.name,
        enabled: source.formData.enabled,
        dataSource,
      })
      Object.assign(transfer.formData, createTransferFormData())
      target.formData.storageTargets = []
      Object.assign(target.backupRepository.formData, createTargetBackupRepositoryFormData())
      Object.assign(target.storageRepository.formData, createTargetStorageRepositoryFormData())
      Object.assign(target.healthCheck.formData, createTargetHealthCheckFormData())
      Object.assign(planning.formData, createPlanningFormData())

      source.reset()
      transfer.reset()
      target.reset()
      planning.reset()
    }
  )

  return {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
    validateAndBuildPayload,
  }
}
