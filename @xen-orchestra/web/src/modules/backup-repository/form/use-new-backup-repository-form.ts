import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { useBackupRepositoryDetailsForms } from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { NewBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-create.job.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format as formatBackupRepositoryUrl } from 'xo-remote-parser'

const STEPS = ['general', 'details', 'review'] as const
type Step = (typeof STEPS)[number]

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const general = useBackupRepositoryGeneralForm(
    reactive<BackupRepositoryGeneralFormData>({
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: false,
      encryptionKey: '',
    })
  )

  const typeLabel = useXoBackupRepositoryTypeLabel(() => general.formData.type)

  const { details, currentDetailsForm } = useBackupRepositoryDetailsForms(general.formData)

  const currentStepIndex = ref(0)

  const currentStep = computed(() => STEPS[currentStepIndex.value])

  const detailsStepLabel = computed(() => {
    return general.formData.type === undefined ? '' : t('br-type-details', { type: typeLabel.value })
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
