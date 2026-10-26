import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
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
  rawIsEphemeralSnapshotAllowed: MaybeRefOrGetter<boolean>
) {
  const { t, locale } = useI18n()

  const { proxies } = useXoProxyCollection()

  const dataSource = toComputed(rawDataSource)

  const isEphemeralSnapshotAllowed = toComputed(rawIsEphemeralSnapshotAllowed)

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
        ltrDailyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrWeeklyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrMonthlyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
        ltrYearlyRetention: { minValue: atLeast(0, () => hasBackupRepositorySection.value) },
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
    validate,
    reset,
  }
}
