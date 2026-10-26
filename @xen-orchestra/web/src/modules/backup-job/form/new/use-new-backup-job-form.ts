import {
  type BackupJobSourceFormData,
  useBackupJobSourceForm,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import {
  type BackupJobTargetFormData,
  useBackupJobTargetForm,
} from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import {
  type BackupJobTransferFormData,
  useBackupJobTransferForm,
} from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['source', 'transfer', 'target', 'planning', 'review'] as const
type Step = (typeof STEPS)[number]

const METADATA_STEPS: Step[] = ['source', 'target', 'planning', 'review']

export function useNewBackupJobForm() {
  const { t } = useI18n()

  const source = useBackupJobSourceForm(
    reactive<BackupJobSourceFormData>({
      dataSource: 'vm',
      mode: 'delta',
      saveXoConfig: false,
      savePoolsMetadata: true,
      proxy: undefined,
      sourceBackupRepository: undefined,
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
      snapshotSync: 'none',
      snapshotSyncTag: undefined,
    })
  )

  const target = useBackupJobTargetForm(
    reactive<BackupJobTargetFormData>({
      storageTargets: [],
      targetProxy: undefined,
      backupRepositoryScopeType: 'all',
      backupDistribution: 'every',
      exportRetention: 3,
      ltrDailyRetention: 1,
      ltrDailyKeep: undefined,
      ltrWeeklyRetention: 1,
      ltrWeeklyKeep: undefined,
      ltrMonthlyRetention: 1,
      ltrMonthlyKeep: undefined,
      ltrYearlyRetention: 1,
      ltrYearlyKeep: undefined,
      strictGfs: false,
      storageRepositoryScopeType: 'all',
      replicaDistribution: 'every',
      copyRetention: 1,
      snapshotRetention: 1,
    }),
    () => source.formData.dataSource,
    () => source.formData.mode === 'full' || transfer.formData.preferNbd
  )

  const currentStepIndex = ref(0)

  const stepKeys = computed<readonly Step[]>(() => (source.formData.dataSource === 'metadata' ? METADATA_STEPS : STEPS))

  const currentStep = computed(() => stepKeys.value[currentStepIndex.value])

  const stepLabels = computed<Record<Step, string>>(() => ({
    source: t('source'),
    transfer: t('transfer'),
    target: t('target'),
    planning: t('planning'),
    review: t('review-and-confirm'),
  }))

  const steps = computed<StepDefinition[]>(() => stepKeys.value.map(step => ({ label: stepLabels.value[step] })))

  async function validateCurrentStep(): Promise<boolean> {
    switch (currentStep.value) {
      case 'source':
        return source.validate()
      case 'transfer':
        return transfer.validate()
      case 'target':
        return target.validate()
      default:
        return true
    }
  }

  function goToStep(step: Step): void {
    currentStepIndex.value = stepKeys.value.indexOf(step)
  }

  async function next(): Promise<boolean> {
    const isValid = await validateCurrentStep()

    if (isValid && currentStepIndex.value < stepKeys.value.length - 1) {
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
    target,
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
  }
}
