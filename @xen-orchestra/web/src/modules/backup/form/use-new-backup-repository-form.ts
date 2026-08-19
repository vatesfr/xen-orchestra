import { useAzureBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-azure-backup-repository-details-form.ts'
import { useLocalBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-local-backup-repository-details-form.ts'
import { useNfsBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-nfs-backup-repository-details-form.ts'
import { useS3BackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-s3-backup-repository-details-form.ts'
import { useSmbBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-smb-backup-repository-details-form.ts'
import { useBackupRepositoryGeneralForm } from '@/modules/backup/form/use-backup-repository-general-form.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['general', 'details'] as const

export type NewBackupRepositoryDetailsForms = ReturnType<typeof useNewBackupRepositoryForm>['details']

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const general = useBackupRepositoryGeneralForm()

  const details = {
    file: useLocalBackupRepositoryDetailsForm(() => general.formData.proxy),
    nfs: useNfsBackupRepositoryDetailsForm(),
    smb: useSmbBackupRepositoryDetailsForm(),
    s3: useS3BackupRepositoryDetailsForm(),
    azure: useAzureBackupRepositoryDetailsForm(),
  }

  const currentDetailsForm = computed(() => {
    const { type } = general.formData

    if (type === undefined) {
      return undefined
    }

    return details[type === 'azurite' ? 'azure' : type]
  })

  const currentStepIndex = ref(0)

  const currentStep = computed(() => STEPS[currentStepIndex.value])

  const detailsStepLabel = computed(() => {
    switch (general.formData.type) {
      case 'file':
        return t('local-details')
      case 'nfs':
        return t('nfs-details')
      case 'smb':
        return t('smb-details')
      case 's3':
        return t('s3-details')
      case 'azure':
        return t('azure-details')
      case 'azurite':
        return t('azurite-details')
      default:
        return ''
    }
  })

  const steps = computed<StepDefinition[]>(() => [
    { label: t('br-details') },
    { label: detailsStepLabel.value },
    { label: '' },
  ])

  async function validateCurrentStep(): Promise<boolean> {
    if (currentStep.value === 'general') {
      return general.validate()
    }

    return (await currentDetailsForm.value?.validate()) ?? false
  }

  async function next(): Promise<boolean> {
    const isValid = await validateCurrentStep()

    if (isValid && currentStepIndex.value < STEPS.length - 1) {
      currentStepIndex.value++
    }

    return isValid
  }

  function back(): void {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  return {
    general,
    details,
    currentStep,
    currentStepIndex,
    steps,
    next,
    back,
  }
}
