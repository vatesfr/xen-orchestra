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
import { computed, reactive } from 'vue'
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

  const steps = computed(() => (isMetadata.value ? METADATA_STEPS : STEPS))

  const stepLabels = computed<Record<BackupJobFormStep, string>>(() => ({
    source: t('source'),
    transfer: t('transfer'),
    target: t('target'),
    planning: t('planning'),
    review: t('review-and-confirm'),
  }))

  function validateStep(step: BackupJobFormDataStep): Promise<boolean> {
    return forms[step].validate()
  }

  async function getInvalidSteps(): Promise<BackupJobFormDataStep[]> {
    const dataSteps = steps.value.filter((step): step is BackupJobFormDataStep => step !== 'review')

    const results = await Promise.all(dataSteps.map(step => validateStep(step)))

    return dataSteps.filter((_, index) => !results[index])
  }

  function buildPayload(): BackupJobPayload {
    return toBackupJobPayload(formDataSet, scheduleKey)
  }

  async function validateAndBuildPayload(): Promise<BackupJobPayload | undefined> {
    const invalidSteps = await getInvalidSteps()

    return invalidSteps.length === 0 ? buildPayload() : undefined
  }

  return {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
    formDataSet,
    steps,
    stepLabels,
    validateStep,
    getInvalidSteps,
    buildPayload,
    validateAndBuildPayload,
  }
}
