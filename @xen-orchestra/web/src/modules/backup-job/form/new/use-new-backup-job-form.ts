import {
  type BackupJobPlanningFormData,
  useBackupJobPlanningForm,
} from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
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
import { type BackupJobPayload, toBackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import { DEFAULT_CRON } from '@/modules/schedule/utils/cron.util.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['source', 'transfer', 'target', 'planning', 'review'] as const
type Step = (typeof STEPS)[number]

const METADATA_STEPS: Step[] = ['source', 'target', 'planning', 'review']

function createSourceFormData(): BackupJobSourceFormData {
  return {
    name: '',
    dataSource: 'vm',
    mode: 'delta',
    saveXoConfig: false,
    savePoolsMetadata: true,
    proxy: undefined,
    sourceBackupRepository: undefined,
    scopeType: 'all',
    vmIds: [],
    vmFilter: '',
    poolIds: [],
    poolFilter: '',
  }
}

function createTransferFormData(): BackupJobTransferFormData {
  return {
    maxExportRate: undefined,
    concurrency: 2,
    compression: '',
    keyBackup: 'never',
    keyBackupMonthDays: [],
    keyBackupWeekDays: [],
    keyBackupHours: [],
    preferNbd: true,
    nbdConcurrency: 1,
    offlineBackup: false,
    snapshotMode: 'default',
    snapshotSync: 'none',
    snapshotSyncTag: undefined,
    snapshotRetention: 1,
  }
}

function createTargetFormData(): BackupJobTargetFormData {
  return {
    storageTargets: [],
    targetProxy: undefined,
    backupRepositoryScopeType: 'all',
    backupRepositoryIds: [],
    backupRepositoryFilter: '',
    backupDistribution: 'every',
    exportRetention: undefined,
    ltrDailyRetention: 0,
    ltrDailyKeep: undefined,
    ltrWeeklyRetention: 0,
    ltrWeeklyKeep: undefined,
    ltrMonthlyRetention: 0,
    ltrMonthlyKeep: undefined,
    ltrYearlyRetention: 0,
    ltrYearlyKeep: undefined,
    strictGfs: false,
    mergeBackupsSynchronously: false,
    storageRepositoryScopeType: 'all',
    storageRepositoryIds: [],
    storageRepositoryFilter: '',
    replicaDistribution: 'every',
    copyRetention: undefined,
    healthCheckEnabled: false,
    healthCheckSr: undefined,
    healthCheckVmTags: [],
    healthCheckTimeout: 10,
    healthCheckSchedule: 'always',
    healthCheckMonthDays: [],
    healthCheckWeekDays: [],
    healthCheckHours: [],
  }
}

function createPlanningFormData(): BackupJobPlanningFormData {
  return {
    enabled: true,
    cron: DEFAULT_CRON,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeout: undefined,
    nRetriesVmBackupFailures: undefined,
    reportWhen: 'failure',
    reportRecipients: [],
    hideSuccessfulItems: false,
  }
}

export function useNewBackupJobForm() {
  const { t } = useI18n()

  const source = useBackupJobSourceForm(reactive(createSourceFormData()))

  const { isIncremental, isMirror, isMetadata } = source

  const transfer = useBackupJobTransferForm(reactive(createTransferFormData()), isIncremental, isMirror)

  const target = useBackupJobTargetForm(
    reactive(createTargetFormData()),
    () => source.formData.dataSource,
    () => source.formData.sourceBackupRepository
  )

  const planning = useBackupJobPlanningForm(reactive(createPlanningFormData()))

  watch(
    () => source.formData.dataSource,
    dataSource => {
      Object.assign(source.formData, { ...createSourceFormData(), name: source.formData.name, dataSource })
      Object.assign(transfer.formData, createTransferFormData())
      Object.assign(target.formData, createTargetFormData())
      Object.assign(planning.formData, createPlanningFormData())

      source.reset()
      transfer.reset()
      target.reset()
      planning.reset()
    }
  )

  const currentStepIndex = ref(0)

  const stepKeys = computed<readonly Step[]>(() => (isMetadata.value ? METADATA_STEPS : STEPS))

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
      case 'planning':
        return planning.validate()
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

  async function validateAndBuildPayload(): Promise<BackupJobPayload | undefined> {
    const forms = isMetadata.value ? [source, target, planning] : [source, transfer, target, planning]

    const results = await Promise.all(forms.map(form => form.validate()))

    if (results.some(isValid => !isValid)) {
      return undefined
    }

    return toBackupJobPayload({
      source: source.formData,
      transfer: transfer.formData,
      target: target.formData,
      planning: planning.formData,
    })
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
