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
import type { BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, ref, watch } from 'vue'

export function useNewBackupJobForm() {
  const {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
    steps: stepKeys,
    stepLabels,
    validateStep,
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

  const currentStepIndex = ref(0)

  const currentStep = computed(() => stepKeys.value[currentStepIndex.value])

  const steps = computed<StepDefinition[]>(() => stepKeys.value.map(step => ({ label: stepLabels.value[step] })))

  async function validateCurrentStep(): Promise<boolean> {
    return currentStep.value === 'review' ? true : validateStep(currentStep.value)
  }

  function goToStep(step: BackupJobFormStep): void {
    currentStepIndex.value = stepKeys.value.indexOf(step)
  }

  async function next(): Promise<void> {
    const isValid = await validateCurrentStep()

    if (isValid && currentStepIndex.value < stepKeys.value.length - 1) {
      currentStepIndex.value++
    }
  }

  function back(): void {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

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
