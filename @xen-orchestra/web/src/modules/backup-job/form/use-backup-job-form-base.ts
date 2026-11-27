import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type { BackupJobTargetStorageRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-storage-repository-form.ts'
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
import type { BackupJobFormDataStep, BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  type BackupJobFormDataSet,
  type BackupJobPayload,
  toBackupJobPayload,
} from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import { DEFAULT_CRON } from '@/modules/schedule/utils/cron.util.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import { cloneDeep } from 'lodash-es'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS: BackupJobFormStep[] = ['source', 'transfer', 'target', 'planning', 'review']

const METADATA_STEPS: BackupJobFormStep[] = ['source', 'target', 'planning', 'review']

export function createSourceFormData(): BackupJobSourceFormData {
  return {
    name: '',
    enabled: true,
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

export function createTransferFormData(): BackupJobTransferFormData {
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

export function createTargetBackupRepositoryFormData(): BackupJobTargetBackupRepositoryFormData {
  return {
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
  }
}

export function createTargetStorageRepositoryFormData(): BackupJobTargetStorageRepositoryFormData {
  return {
    storageRepositoryScopeType: 'all',
    storageRepositoryIds: [],
    storageRepositoryFilter: '',
    replicaDistribution: 'every',
    copyRetention: undefined,
  }
}

export function createTargetHealthCheckFormData(): BackupJobTargetHealthCheckFormData {
  return {
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

export function createTargetFormData(): BackupJobTargetFormData {
  return {
    storageTargets: [],
    backupRepository: createTargetBackupRepositoryFormData(),
    storageRepository: createTargetStorageRepositoryFormData(),
    healthCheck: createTargetHealthCheckFormData(),
  }
}

export function createPlanningFormData(): BackupJobPlanningFormData {
  return {
    cron: DEFAULT_CRON,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeout: undefined,
    nRetriesVmBackupFailures: undefined,
    reportWhen: 'failure',
    reportRecipients: [],
    hideSuccessfulItems: false,
  }
}

export function createBackupJobFormDataSet(): BackupJobFormDataSet {
  return {
    source: createSourceFormData(),
    transfer: createTransferFormData(),
    target: createTargetFormData(),
    planning: createPlanningFormData(),
  }
}

export function useBackupJobFormBase(
  initialFormDataSet: BackupJobFormDataSet,
  { isEditing = false, scheduleKey }: { isEditing?: boolean; scheduleKey?: string } = {}
) {
  const { t } = useI18n()

  const savedFormDataSet = isEditing ? cloneDeep(initialFormDataSet) : undefined

  const source = useBackupJobSourceForm(reactive(initialFormDataSet.source), { isEditing })

  const { isIncremental, isMirror, isMetadata } = source

  const transfer = useBackupJobTransferForm(reactive(initialFormDataSet.transfer), isIncremental, isMirror)

  const target = useBackupJobTargetForm(
    reactive(initialFormDataSet.target),
    () => source.formData.dataSource,
    () => source.formData.sourceBackupRepository,
    () => source.formData.proxy,
    { isEditing }
  )

  const planning = useBackupJobPlanningForm(reactive(initialFormDataSet.planning))

  const formDataSet: BackupJobFormDataSet = {
    source: source.formData,
    transfer: transfer.formData,
    target: target.formData,
    planning: planning.formData,
  }

  const forms = { source, transfer, target, planning }

  const stepKeys = computed(() => (isMetadata.value ? METADATA_STEPS : STEPS))

  const stepLabels = computed<Record<BackupJobFormStep, string>>(() => ({
    source: t('source'),
    transfer: t('transfer'),
    target: t('target'),
    planning: t('planning'),
    review: t('review-and-confirm'),
  }))

  const currentStepIndex = ref(0)

  const currentStep = computed(() => stepKeys.value[currentStepIndex.value])

  const steps = computed<StepDefinition[]>(() => stepKeys.value.map(step => ({ label: stepLabels.value[step] })))

  function validateStep(step: BackupJobFormDataStep): Promise<boolean> {
    return forms[step].validate()
  }

  async function getInvalidSteps(): Promise<BackupJobFormDataStep[]> {
    const dataSteps = stepKeys.value.filter((step): step is BackupJobFormDataStep => step !== 'review')

    const results = await Promise.all(dataSteps.map(step => validateStep(step)))

    return dataSteps.filter((_, index) => !results[index])
  }

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

  async function validateAndBuildPayload(): Promise<BackupJobPayload | undefined> {
    const invalidSteps = await getInvalidSteps()

    return invalidSteps.length === 0 ? toBackupJobPayload(formDataSet, scheduleKey, isEditing) : undefined
  }

  return {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
    savedFormDataSet,
    currentStep,
    currentStepIndex,
    steps,
    goToStep,
    next,
    back,
    validateAndBuildPayload,
  }
}
