import { useBackupRepositoryFormBase } from '@/modules/backup-repository/form/use-backup-repository-form-base.ts'
import {
  type BackupRepositoryGeneralFormData,
  ENCRYPTION_KEY_LENGTH,
  ENCRYPTION_KEY_REGEX,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { regex, withMessage } from '@core/packages/form-validation'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['general', 'details', 'review'] as const
type Step = (typeof STEPS)[number]

export function useNewBackupRepositoryForm() {
  const { t } = useI18n()

  const {
    general,
    details,
    currentDetailsForm,
    detailsTitle: detailsStepLabel,
    validateAndBuildPayload,
  } = useBackupRepositoryFormBase(
    reactive<BackupRepositoryGeneralFormData>({
      name: '',
      type: undefined,
      backupFormat: undefined,
      proxy: undefined,
      encrypted: false,
      encryptionKey: '',
    }),
    {
      extraConfig: {
        errors: {
          onBlur: () => ({
            encryptionKey: {
              regex: withMessage(regex(ENCRYPTION_KEY_REGEX), () =>
                t('encryption-key-invalid', { n: ENCRYPTION_KEY_LENGTH })
              ),
            },
          }),
        },
      },
    }
  )

  const currentStepIndex = ref(0)

  const currentStep = computed(() => STEPS[currentStepIndex.value])

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
