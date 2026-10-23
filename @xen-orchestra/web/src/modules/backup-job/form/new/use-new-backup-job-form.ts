import {
  type BackupJobSourceFormData,
  useBackupJobSourceForm,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import {
  type BackupJobTransferFormData,
  useBackupJobTransferForm,
} from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['source', 'transfer', 'target', 'planning', 'review'] as const
type Step = (typeof STEPS)[number]

export function useNewBackupJobForm() {
  const { t } = useI18n()

  const source = useBackupJobSourceForm(
    reactive<BackupJobSourceFormData>({
      dataSource: 'vm',
      mode: 'delta',
      proxy: undefined,
      backupRepositorySourceType: 'manual',
      scopeType: 'all',
    })
  )

  const transfer = useBackupJobTransferForm(
    reactive<BackupJobTransferFormData>({
      maxExportRate: undefined,
      concurrency: 2,
      keyBackup: 'never',
      keyBackupFilter: '',
      preferNbd: true,
      nbdConcurrency: 1,
      snapshotMode: 'default',
      snapshotSync: 'disabled',
    })
  )

  const currentStepIndex = ref(0)

  const currentStep = computed(() => STEPS[currentStepIndex.value])

  const steps = computed<StepDefinition[]>(() => [
    { label: t('source') },
    { label: t('transfer') },
    { label: t('target') },
    { label: t('planning') },
    { label: t('review-and-confirm') },
  ])

  async function validateCurrentStep(): Promise<boolean> {
    switch (currentStep.value) {
      case 'source':
        return source.validate()
      case 'transfer':
        return transfer.validate()
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
    source,
    transfer,
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
  }
}
