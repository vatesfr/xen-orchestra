import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import { useBackupRepositoryFilterableData } from '@/modules/backup-repository/composables/use-backup-repository-query-builder.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobStorageTarget = 'backup-repository' | 'storage-repository' | 'snapshot-retention'

export type BackupJobTargetScopeType = 'all' | 'manual' | 'smart'

export type BackupJobBackupDistribution = 'every' | 'distribute'

export type BackupJobReplicaDistribution = 'every' | 'distribute'

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
  storageRepositoryScopeType: BackupJobTargetScopeType
  storageRepositoryIds: FrontXoSr['id'][]
  storageRepositoryFilter: string
  replicaDistribution: BackupJobReplicaDistribution
  copyRetention: number | undefined
  snapshotRetention: number | undefined
}

type ChoiceOption<TValue extends string> = { label: string; value: TValue }

type KeepOption = { label: string; value: number }

export type BackupJobTargetForm = ReturnType<typeof useBackupJobTargetForm>

export function useBackupJobTargetForm(
  formData: BackupJobTargetFormData,
  rawDataSource: MaybeRefOrGetter<BackupJobDataSource>,
  rawIsEphemeralSnapshotAllowed: MaybeRefOrGetter<boolean>,
  rawSourceBackupRepositoryId: MaybeRefOrGetter<FrontXoBackupRepository['id'] | undefined>
) {
  const { t, locale } = useI18n()

  const { proxies } = useXoProxyCollection()

  const dataSource = toComputed(rawDataSource)

  const isEphemeralSnapshotAllowed = toComputed(rawIsEphemeralSnapshotAllowed)

  const sourceBackupRepositoryId = toComputed(rawSourceBackupRepositoryId)

  const { backupRepositories } = useXoBackupRepositoryCollection()

  const { srs } = useXoSrCollection()

  const availableBackupRepositories = computed(() =>
    backupRepositories.value.filter(br => br.id !== sourceBackupRepositoryId.value)
  )

  const availableStorageRepositories = computed(() => srs.value.filter(sr => sr.content_type !== 'iso'))

  const filterableBackupRepositories = useBackupRepositoryFilterableData(availableBackupRepositories)

  const matchedBackupRepositories = computed(() =>
    filterByQuery(filterableBackupRepositories.value, formData.backupRepositoryFilter)
  )

  const matchedStorageRepositories = computed(() =>
    filterByQuery(availableStorageRepositories.value, formData.storageRepositoryFilter)
  )

  const hasStorageTargetChoice = computed(() => dataSource.value === 'vm')

  const hasBackupRepositorySection = computed(
    () =>
      dataSource.value === 'mirror' ||
      (dataSource.value === 'vm' && formData.storageTargets.includes('backup-repository'))
  )

  const hasStorageRepositorySection = computed(
    () => dataSource.value === 'vm' && formData.storageTargets.includes('storage-repository')
  )

  const hasSnapshotRetentionSection = computed(
    () => dataSource.value === 'vm' && formData.storageTargets.includes('snapshot-retention')
  )

  function atLeast(min: number, isActive: () => boolean) {
    return withMessage(
      (value: number | undefined) => !isActive() || typeof value !== 'number' || value >= min,
      () => t('must-be-at-least-n', { n: min })
    )
  }

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
        ltrDailyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrWeeklyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrMonthlyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrYearlyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
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
        snapshotRetention: {
          requiredIf: withMessage(
            requiredIf(() => hasSnapshotRetentionSection.value),
            () => t('minimum-snapshots-to-retain-mandatory')
          ),
          minValue: atLeast(0, () => hasSnapshotRetentionSection.value),
          ephemeralSnapshot: withMessage(
            (value: number | undefined) =>
              !hasSnapshotRetentionSection.value || value !== 0 || isEphemeralSnapshotAllowed.value,
            () => t('ephemeral-snapshot-requires-nbd')
          ),
        },
      }),
    },
  })

  const storageTargetOptions = computed<ChoiceOption<BackupJobStorageTarget>[]>(() => [
    { label: t('backup-repository'), value: 'backup-repository' },
    { label: t('storage-repository'), value: 'storage-repository' },
    { label: t('snapshot-retention'), value: 'snapshot-retention' },
  ])

  const backupRepositoryScopeTypeOptions = computed<ChoiceOption<BackupJobTargetScopeType>[]>(() => [
    { label: t('all-objects-brs'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const backupDistributionOptions = computed<ChoiceOption<BackupJobBackupDistribution>[]>(() => [
    { label: t('store-backups-on-every-backup-repository'), value: 'every' },
    { label: t('distribute-backups-across-backup-repositories'), value: 'distribute' },
  ])

  const storageRepositoryScopeTypeOptions = computed<ChoiceOption<BackupJobTargetScopeType>[]>(() => [
    { label: t('all-objects-srs'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const replicaDistributionOptions = computed<ChoiceOption<BackupJobReplicaDistribution>[]>(() => [
    { label: t('store-replicas-on-every-storage-repository'), value: 'every' },
    { label: t('distribute-replicas-across-storage-repositories'), value: 'distribute' },
  ])

  const { id: targetProxySelectId } = useFormSelect('targetProxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const hourOptions = computed<KeepOption[]>(() =>
    Array.from({ length: 24 }, (_, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, value: hour }))
  )

  const weekDayOptions = computed<KeepOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { weekday: 'long', timeZone: 'UTC' })

    return Array.from({ length: 7 }, (_, day) => ({
      label: format.format(Date.UTC(2024, 0, 1 + day)),
      value: day,
    }))
  })

  const monthDayOptions = computed<KeepOption[]>(() =>
    Array.from({ length: 31 }, (_, day) => ({ label: String(day + 1), value: day + 1 }))
  )

  const monthOptions = computed<KeepOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { month: 'long', timeZone: 'UTC' })

    return Array.from({ length: 12 }, (_, month) => ({ label: format.format(Date.UTC(2024, month, 1)), value: month }))
  })

  function useKeepSelect(
    key: 'ltrDailyKeep' | 'ltrWeeklyKeep' | 'ltrMonthlyKeep' | 'ltrYearlyKeep',
    options: () => KeepOption[],
    firstLabel: () => string
  ) {
    const { id } = useFormSelect(key, options, {
      emptyOption: () => ({ label: firstLabel(), value: undefined }),
      option: { id: 'value', label: 'label', value: 'value' },
    })

    return useSelect(id)
  }

  type LongTermRetentionPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

  const keepOptionsByPeriod = computed<Record<LongTermRetentionPeriod, KeepOption[]>>(() => ({
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
    targetProxy: useSelect(targetProxySelectId, () => ({ label: t('target-proxy') })),
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
      info: t('value-by-default', { value: 3 }),
    })),
    ltrDailyRetention: useField('ltrDailyRetention'),
    ltrDailyKeep: useKeepSelect(
      'ltrDailyKeep',
      () => hourOptions.value,
      () => t('first-of-day')
    ),
    ltrWeeklyRetention: useField('ltrWeeklyRetention'),
    ltrWeeklyKeep: useKeepSelect(
      'ltrWeeklyKeep',
      () => weekDayOptions.value,
      () => t('first-of-week')
    ),
    ltrMonthlyRetention: useField('ltrMonthlyRetention'),
    ltrMonthlyKeep: useKeepSelect(
      'ltrMonthlyKeep',
      () => monthDayOptions.value,
      () => t('first-of-month')
    ),
    ltrYearlyRetention: useField('ltrYearlyRetention'),
    ltrYearlyKeep: useKeepSelect(
      'ltrYearlyKeep',
      () => monthOptions.value,
      () => t('first-of-year')
    ),
    strictGfs: useField('strictGfs', () => ({
      label: t('enforce-strict-gfs-hierarchy'),
      info: t('enforce-strict-gfs-hierarchy-info'),
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
      info: t('value-by-default', { value: 1 }),
    })),
    snapshotRetention: useField('snapshotRetention', () => ({
      label: t('minimum-snapshots-to-retain'),
    })),
  })

  return {
    formData,
    bindings,
    hasStorageTargetChoice,
    hasBackupRepositorySection,
    hasStorageRepositorySection,
    hasSnapshotRetentionSection,
    availableBackupRepositories,
    availableStorageRepositories,
    matchedBackupRepositories,
    matchedStorageRepositories,
    getKeepLabel,
    validate,
    reset,
  }
}
