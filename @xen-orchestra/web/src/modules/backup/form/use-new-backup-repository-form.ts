import { useXoBackupRepositoryUtils } from '@/modules/backup/composables/xo-backup-repository-utils.composable.ts'
import { useAzureBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-azure-backup-repository-details-form.ts'
import { useLocalBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-local-backup-repository-details-form.ts'
import { useNfsBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-nfs-backup-repository-details-form.ts'
import { useS3BackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-s3-backup-repository-details-form.ts'
import { useSmbBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-smb-backup-repository-details-form.ts'
import { useBackupRepositoryGeneralForm } from '@/modules/backup/form/use-backup-repository-general-form.ts'
import type { NewBackupRepositoryPayload } from '@/modules/backup/jobs/xo-backup-repository-create.job.ts'
import { formatBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['general', 'details', 'review'] as const
type Step = (typeof STEPS)[number]

export type NewBackupRepositoryDetailsForms = ReturnType<typeof useNewBackupRepositoryForm>['details']

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const general = useBackupRepositoryGeneralForm()

  const { getTypeLabel } = useXoBackupRepositoryUtils()

  const details = {
    file: useLocalBackupRepositoryDetailsForm(() => general.formData.proxy),
    nfs: useNfsBackupRepositoryDetailsForm(),
    smb: useSmbBackupRepositoryDetailsForm(),
    s3: useS3BackupRepositoryDetailsForm(),
    azure: useAzureBackupRepositoryDetailsForm(() => general.formData.type),
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
    return general.formData.type === undefined
      ? ''
      : t('br-type-details', { type: getTypeLabel(general.formData.type) })
  })

  const steps = computed<StepDefinition[]>(() => [
    { label: t('br-details') },
    { label: detailsStepLabel.value },
    { label: t('review-and-confirm') },
  ])

  watch(
    () => general.formData.type,
    () => {
      currentDetailsForm.value?.reset()
    }
  )

  async function validateCurrentStep(): Promise<boolean> {
    switch (currentStep.value) {
      case 'general':
        return general.validate()
      case 'details':
        return (await currentDetailsForm.value?.validate()) ?? false
      default:
        return true
    }
  }

  function goToStep(step: Step): void {
    currentStepIndex.value = STEPS.indexOf(step)
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

  async function validateAndBuildPayload(): Promise<NewBackupRepositoryPayload | undefined> {
    const detailForm = currentDetailsForm.value

    if (detailForm === undefined) {
      return undefined
    }

    const isGeneralValid = await general.validate()
    const areDetailsValid = await detailForm.validate()

    if (!isGeneralValid || !areDetailsValid) {
      return undefined
    }

    const { urlInfo, options } = detailForm.buildPayload()

    return {
      name: general.formData.name,
      url: formatBackupRepositoryUrl({ ...urlInfo, ...general.buildUrlOptions() }),
      ...(options !== undefined && { options }),
      ...(general.formData.proxy !== undefined && { proxy: general.formData.proxy }),
    }
  }

  return {
    general,
    details,
    currentStep,
    detailsStepLabel,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
    validateAndBuildPayload,
  }
}
