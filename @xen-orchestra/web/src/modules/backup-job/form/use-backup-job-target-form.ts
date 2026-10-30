import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import { useBackupRepositoryFilterableData } from '@/modules/backup-repository/composables/use-backup-repository-query-builder.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useScheduleCalendarOptions } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
import { useSrFormFilterableData } from '@/modules/storage-repository/composables/use-sr-form-query-builder.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobStorageTarget = 'backup-repository' | 'storage-repository'

export type BackupJobTargetScopeType = 'all' | 'manual' | 'smart'

export type BackupJobBackupDistribution = 'every' | 'distribute'

export type BackupJobReplicaDistribution = 'every' | 'distribute'

export type BackupJobHealthCheckSchedule = 'always' | 'dynamic'

export type BackupJobTargetFormData = {
  storageTargets: BackupJobStorageTarget[]
  targetProxy: FrontXoProxy['id'] | undefined
  backupRepositoryScopeType: BackupJobTargetScopeType
  backupRepositoryIds: FrontXoBackupRepository['id'][]
  backupRepositoryFilter: string
  backupDistribution: BackupJobBackupDistribution
  exportRetention: number | undefined
  ltrDailyRetention: number | undefined
  ltrDailyKeep: number | undefined
  ltrWeeklyRetention: number | undefined
  ltrWeeklyKeep: number | undefined
  ltrMonthlyRetention: number | undefined
  ltrMonthlyKeep: number | undefined
  ltrYearlyRetention: number | undefined
  ltrYearlyKeep: number | undefined
  strictGfs: boolean
  mergeBackupsSynchronously: boolean
  storageRepositoryScopeType: BackupJobTargetScopeType
  storageRepositoryIds: FrontXoSr['id'][]
  storageRepositoryFilter: string
  replicaDistribution: BackupJobReplicaDistribution
  copyRetention: number | undefined
  healthCheckEnabled: boolean
  healthCheckSr: FrontXoSr['id'] | undefined
  healthCheckVmTags: string[]
  healthCheckTimeout: number | undefined
  healthCheckSchedule: BackupJobHealthCheckSchedule
  healthCheckMonthDays: number[]
  healthCheckWeekDays: number[]
  healthCheckHours: number[]
}

export type BackupJobTargetForm = ReturnType<typeof useBackupJobTargetForm>

export function useBackupJobTargetForm(
  formData: BackupJobTargetFormData,
  rawDataSource: MaybeRefOrGetter<BackupJobDataSource>,
  rawSourceBackupRepositoryId: MaybeRefOrGetter<FrontXoBackupRepository['id'] | undefined>
) {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const dataSource = toComputed(rawDataSource)

  const sourceBackupRepositoryId = toComputed(rawSourceBackupRepositoryId)

  const { backupRepositories } = useXoBackupRepositoryCollection()

  const { srs } = useXoSrCollection()

  const availableBackupRepositories = computed(() =>
    backupRepositories.value.filter(br => br.id !== sourceBackupRepositoryId.value)
  )

  const availableStorageRepositories = computed(() => srs.value.filter(isSrWritable))

  const filterableStorageRepositories = useSrFormFilterableData(availableStorageRepositories)

  const compatibleBackupRepositories = computed(() =>
    availableBackupRepositories.value.filter(br => br.proxy === formData.targetProxy)
  )

  const filterableBackupRepositories = useBackupRepositoryFilterableData(compatibleBackupRepositories)

  const matchedBackupRepositories = computed(() =>
    filterByQuery(filterableBackupRepositories.value, formData.backupRepositoryFilter)
  )

  const matchedStorageRepositories = computed(() =>
    filterByQuery(filterableStorageRepositories.value, formData.storageRepositoryFilter)
  )

  watch(compatibleBackupRepositories, brs => {
    const compatibleIds = new Set(brs.map(br => br.id))

    if (formData.backupRepositoryIds.some(id => !compatibleIds.has(id))) {
      formData.backupRepositoryIds = formData.backupRepositoryIds.filter(id => compatibleIds.has(id))
    }
  })

  const hasStorageTargetChoice = computed(() => dataSource.value === 'vm')

  const hasBackupRepositorySection = computed(
    () => dataSource.value !== 'vm' || formData.storageTargets.includes('backup-repository')
  )

  const hasRetentionStrategy = computed(() => hasBackupRepositorySection.value && dataSource.value !== 'metadata')

  const hasStrictGfs = computed(() => hasRetentionStrategy.value && dataSource.value !== 'mirror')

  const hasHealthCheckSection = computed(() => dataSource.value !== 'metadata')

  const isHealthCheckEnabled = computed(() => hasHealthCheckSection.value && formData.healthCheckEnabled)

  const isHealthCheckDynamic = computed(() => isHealthCheckEnabled.value && formData.healthCheckSchedule === 'dynamic')

  const hasStorageRepositorySection = computed(
    () => dataSource.value === 'vm' && formData.storageTargets.includes('storage-repository')
  )

  const { atLeast, calendarRules } = useBackupJobFormRules()

  const healthCheckCalendarRules = calendarRules(
    () => isHealthCheckDynamic.value,
    () => formData.healthCheckWeekDays
  )

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        storageTargets: {
          requiredIf: withMessage(
            requiredIf(() => hasStorageTargetChoice.value),
            () => t('select-at-least-one-storage-target')
          ),
        },
        exportRetention: {
          requiredIf: withMessage(
            requiredIf(() => hasBackupRepositorySection.value),
            () => t('minimum-backups-to-retain-mandatory')
          ),
          minValue: atLeast(1, () => hasBackupRepositorySection.value),
        },
        backupRepositoryIds: {
          atLeastOne: withMessage(
            () =>
              !hasBackupRepositorySection.value ||
              formData.backupRepositoryScopeType !== 'manual' ||
              formData.backupRepositoryIds.length > 0,
            () => t('select-at-least-one-backup-repository')
          ),
        },
        backupRepositoryFilter: {
          atLeastOneMatch: withMessage(
            () =>
              !hasBackupRepositorySection.value ||
              formData.backupRepositoryScopeType !== 'smart' ||
              matchedBackupRepositories.value.length > 0,
            () => t('query-matches-no-backup-repository')
          ),
        },
        ltrDailyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrWeeklyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrMonthlyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrYearlyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        storageRepositoryIds: {
          atLeastOne: withMessage(
            () =>
              !hasStorageRepositorySection.value ||
              formData.storageRepositoryScopeType !== 'manual' ||
              formData.storageRepositoryIds.length > 0,
            () => t('select-at-least-one-storage-repository')
          ),
        },
        storageRepositoryFilter: {
          atLeastOneMatch: withMessage(
            () =>
              !hasStorageRepositorySection.value ||
              formData.storageRepositoryScopeType !== 'smart' ||
              matchedStorageRepositories.value.length > 0,
            () => t('query-matches-no-storage-repository')
          ),
        },
        copyRetention: {
          requiredIf: withMessage(
            requiredIf(() => hasStorageRepositorySection.value),
            () => t('minimum-replicas-to-retain-mandatory')
          ),
          minValue: atLeast(1, () => hasStorageRepositorySection.value),
        },
        healthCheckSr: {
          requiredIf: withMessage(
            requiredIf(() => isHealthCheckEnabled.value),
            () => t('health-check-sr-mandatory')
          ),
        },
        healthCheckTimeout: {
          requiredIf: withMessage(
            requiredIf(() => isHealthCheckEnabled.value),
            () => t('health-check-timeout-mandatory')
          ),
          minValue: atLeast(1, () => isHealthCheckEnabled.value),
        },
        healthCheckMonthDays: healthCheckCalendarRules.monthDays,
        healthCheckHours: healthCheckCalendarRules.hours,
      }),
    },
  })

  const storageTargetOptions = computed<BackupJobFormOption<BackupJobStorageTarget>[]>(() => [
    { label: t('backup-repository'), value: 'backup-repository' },
    { label: t('storage-repository'), value: 'storage-repository' },
  ])

  const backupRepositoryScopeTypeOptions = computed<BackupJobFormOption<BackupJobTargetScopeType>[]>(() => [
    { label: t('all-objects-brs'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const backupDistributionOptions = computed<BackupJobFormOption<BackupJobBackupDistribution>[]>(() => [
    { label: t('store-backups-on-every-backup-repository'), value: 'every' },
    { label: t('distribute-backups-across-backup-repositories'), value: 'distribute' },
  ])

  const storageRepositoryScopeTypeOptions = computed<BackupJobFormOption<BackupJobTargetScopeType>[]>(() => [
    { label: t('all-objects-srs'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const replicaDistributionOptions = computed<BackupJobFormOption<BackupJobReplicaDistribution>[]>(() => [
    { label: t('store-replicas-on-every-storage-repository'), value: 'every' },
    { label: t('distribute-replicas-across-storage-repositories'), value: 'distribute' },
  ])

  const healthCheckScheduleOptions = computed<BackupJobFormOption<BackupJobHealthCheckSchedule>[]>(() => [
    { label: t('always'), value: 'always' },
    { label: t('dynamic-selection'), value: 'dynamic' },
  ])

  const { vms } = useXoVmCollection()

  const vmTags = computed(() => [...new Set(vms.value.flatMap(vm => vm.tags))].sort())

  const calendarOptions = useScheduleCalendarOptions()

  const { id: healthCheckSrSelectId } = useFormSelect('healthCheckSr', availableStorageRepositories, {
    searchable: true,
    required: true,
    option: { label: 'name_label', value: 'id' },
  })

  const { id: healthCheckVmTagsSelectId } = useFormSelect('healthCheckVmTags', vmTags, {
    searchable: true,
    multiple: true,
  })

  const { id: targetProxySelectId } = useFormSelect('targetProxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const { hourOptions, weekDayOptions, monthDayOptions, monthOptions } = useScheduleCalendarOptions({
    weekDayFormat: 'long',
    withMinutes: true,
  })

  type LongTermRetentionPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

  const keepOptionsByPeriod = computed<Record<LongTermRetentionPeriod, BackupJobFormOption<number>[]>>(() => ({
    daily: hourOptions.value,
    weekly: weekDayOptions.value,
    monthly: monthDayOptions.value,
    yearly: monthOptions.value,
  }))

  const firstKeepLabels = computed<Record<LongTermRetentionPeriod, string>>(() => ({
    daily: t('first-of-day'),
    weekly: t('first-of-week'),
    monthly: t('first-of-month'),
    yearly: t('first-of-year'),
  }))

  function useKeepSelect(
    key: 'ltrDailyKeep' | 'ltrWeeklyKeep' | 'ltrMonthlyKeep' | 'ltrYearlyKeep',
    period: LongTermRetentionPeriod
  ) {
    const { id } = useFormSelect(key, () => keepOptionsByPeriod.value[period], {
      emptyOption: () => ({ label: firstKeepLabels.value[period], value: undefined }),
      option: { id: 'value', label: 'label', value: 'value' },
    })

    return useSelect(id)
  }

  function getKeepLabel(period: LongTermRetentionPeriod, value: number | undefined): string {
    if (value === undefined) {
      return firstKeepLabels.value[period]
    }

    return keepOptionsByPeriod.value[period].find(option => option.value === value)?.label ?? String(value)
  }

  const bindings = reactive({
    storageTargets: useField('storageTargets', () => ({
      label: t('storage-target'),
      options: storageTargetOptions.value,
    })),
    targetProxy: useSelect(targetProxySelectId, () => ({
      label: t('target-proxy'),
      info:
        formData.targetProxy !== undefined
          ? t('only-backup-repositories-using-this-proxy')
          : t('only-backup-repositories-without-proxy'),
    })),
    backupRepositoryScopeType: useField('backupRepositoryScopeType', () => ({
      label: t('scope-type'),
      options: backupRepositoryScopeTypeOptions.value,
    })),
    backupRepositoryIds: useField('backupRepositoryIds'),
    backupRepositoryFilter: useField('backupRepositoryFilter'),
    backupDistribution: useField('backupDistribution', () => ({
      label: t('backup-distribution-strategy'),
      options: backupDistributionOptions.value,
    })),
    exportRetention: useField('exportRetention', () => ({
      label: t('minimum-backups-to-retain'),
      required: true,
    })),
    ltrDailyRetention: useField('ltrDailyRetention'),
    ltrDailyKeep: useKeepSelect('ltrDailyKeep', 'daily'),
    ltrWeeklyRetention: useField('ltrWeeklyRetention'),
    ltrWeeklyKeep: useKeepSelect('ltrWeeklyKeep', 'weekly'),
    ltrMonthlyRetention: useField('ltrMonthlyRetention'),
    ltrMonthlyKeep: useKeepSelect('ltrMonthlyKeep', 'monthly'),
    ltrYearlyRetention: useField('ltrYearlyRetention'),
    ltrYearlyKeep: useKeepSelect('ltrYearlyKeep', 'yearly'),
    strictGfs: useField('strictGfs', () => ({
      label: t('enforce-strict-gfs-hierarchy'),
      info: t('enforce-strict-gfs-hierarchy-info'),
    })),
    mergeBackupsSynchronously: useField('mergeBackupsSynchronously', () => ({
      label: t('merge-backups-synchronously'),
      info: t('merge-backups-synchronously-info'),
    })),
    storageRepositoryScopeType: useField('storageRepositoryScopeType', () => ({
      label: t('scope-type'),
      options: storageRepositoryScopeTypeOptions.value,
    })),
    storageRepositoryIds: useField('storageRepositoryIds'),
    storageRepositoryFilter: useField('storageRepositoryFilter'),
    replicaDistribution: useField('replicaDistribution', () => ({
      label: t('replica-distribution-strategy'),
      options: replicaDistributionOptions.value,
    })),
    copyRetention: useField('copyRetention', () => ({
      label: t('minimum-replicas-to-retain'),
      required: true,
    })),
    healthCheckEnabled: useField('healthCheckEnabled', () => ({
      label: t('enable-health-check'),
      info: t('health-check-info'),
    })),
    healthCheckSr: useSelect(healthCheckSrSelectId, () => ({ label: t('health-check-sr') })),
    healthCheckVmTags: useSelect(healthCheckVmTagsSelectId, () => ({
      label: t('health-check-vm-tags'),
      info: t('health-check-vm-tags-info'),
    })),
    healthCheckTimeout: useField('healthCheckTimeout', () => ({
      label: t('timeout'),
      required: true,
      unit: t('minutes'),
    })),
    healthCheckSchedule: useField('healthCheckSchedule', () => ({
      label: t('health-check-frequency'),
      options: healthCheckScheduleOptions.value,
    })),
    healthCheckMonthDays: useField('healthCheckMonthDays', () => ({
      label: t('days-of-the-month'),
      options: calendarOptions.monthDayOptions.value,
    })),
    healthCheckWeekDays: useField('healthCheckWeekDays', () => ({
      label: t('days-of-the-week'),
      options: calendarOptions.weekDayOptions.value,
    })),
    healthCheckHours: useField('healthCheckHours', () => ({
      label: t('hours'),
      options: calendarOptions.hourOptions.value,
    })),
  })

  return {
    formData,
    bindings,
    hasStorageTargetChoice,
    hasBackupRepositorySection,
    hasRetentionStrategy,
    hasStrictGfs,
    hasHealthCheckSection,
    hasStorageRepositorySection,
    availableBackupRepositories,
    compatibleBackupRepositories,
    availableStorageRepositories,
    matchedBackupRepositories,
    matchedStorageRepositories,
    getKeepLabel,
    validate,
    reset,
  }
}
