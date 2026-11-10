import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import { useBackupJobScopeTypeOptions } from '@/modules/backup-job/composables/use-backup-job-scope-type-options.composable.ts'
import type { BackupJobFormOption, BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  type BackupRepositoryExpressionContext,
  toBackupRepositoryExpressionContext,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import type { LongTermRetentionPeriod } from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { toBackupRepositoryQueryPreviewItem } from '@/modules/backup-repository/utils/xo-backup-repository-query-preview-item.util.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useScheduleCalendarOptions } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
import { queryFilter, requiredIf, withMessage } from '@core/packages/form-validation'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE } from 'xo-remote-parser'

export type BackupJobBackupDistribution = 'every' | 'distribute'

export type BackupJobTargetBackupRepositoryFormData = {
  targetProxy: FrontXoProxy['id'] | undefined
  backupRepositoryScopeType: BackupJobScopeType
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
}

export type BackupJobTargetBackupRepositoryForm = ReturnType<typeof useBackupJobTargetBackupRepositoryForm>

export function useBackupJobTargetBackupRepositoryForm(
  formData: BackupJobTargetBackupRepositoryFormData,
  rawIsActive: MaybeRefOrGetter<boolean>,
  rawHasRetentionStrategy: MaybeRefOrGetter<boolean>,
  rawSourceBackupRepositoryId: MaybeRefOrGetter<FrontXoBackupRepository['id'] | undefined>
) {
  const { t } = useI18n()

  const isActive = toComputed(rawIsActive)

  const hasRetentionStrategy = toComputed(rawHasRetentionStrategy)

  const sourceBackupRepositoryId = toComputed(rawSourceBackupRepositoryId)

  const { proxies } = useXoProxyCollection()

  const { backupRepositories, areBackupRepositoriesReady } = useXoBackupRepositoryCollection()

  const availableBackupRepositories = computed(() =>
    backupRepositories.value.filter(br => br.id !== sourceBackupRepositoryId.value)
  )

  const compatibleBackupRepositories = computed(() =>
    availableBackupRepositories.value.filter(br => br.proxy === formData.targetProxy)
  )

  const matchedBackupRepositories = computed(() =>
    filterByQuery(
      compatibleBackupRepositories.value.filter(br => br.enabled),
      formData.backupRepositoryFilter,
      toBackupRepositoryExpressionContext
    )
  )

  const backupRepositoryTypeLabels = Object.fromEntries(
    Object.values(BACKUP_REPOSITORY_TYPE).map(type => [type, useXoBackupRepositoryTypeLabel(type).value])
  )

  const backupRepositorySchema = useQueryBuilderSchema<BackupRepositoryExpressionContext>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    type: useStringSchema(t('type'), backupRepositoryTypeLabels),
  })

  const matchedBackupRepositoryItems = computed(() =>
    matchedBackupRepositories.value.map(toBackupRepositoryQueryPreviewItem)
  )

  const selectedBackupRepositoryItems = computed(() =>
    compatibleBackupRepositories.value
      .filter(br => formData.backupRepositoryIds.includes(br.id))
      .map(toBackupRepositoryQueryPreviewItem)
  )

  watch(compatibleBackupRepositories, brs => {
    const compatibleIds = new Set(brs.map(br => br.id))

    if (formData.backupRepositoryIds.some(id => !compatibleIds.has(id))) {
      formData.backupRepositoryIds = formData.backupRepositoryIds.filter(id => compatibleIds.has(id))
    }
  })

  const { atLeast } = useBackupJobFormRules()

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        exportRetention: {
          requiredIf: withMessage(
            requiredIf(() => isActive.value),
            () => t('minimum-backups-to-retain-mandatory')
          ),
          minValue: atLeast(1, () => isActive.value),
        },
        backupRepositoryIds: {
          atLeastOne: withMessage(
            () =>
              !isActive.value ||
              formData.backupRepositoryScopeType !== 'manual' ||
              formData.backupRepositoryIds.length > 0,
            () => t('select-at-least-one-backup-repository')
          ),
        },
        backupRepositoryFilter: {
          queryFilter: withMessage(queryFilter, () => t('invalid-query')),
          atLeastOneMatch: withMessage(
            () =>
              !isActive.value ||
              formData.backupRepositoryScopeType !== 'smart' ||
              matchedBackupRepositories.value.length > 0,
            () => t('query-matches-no-backup-repository')
          ),
        },
        ltrDailyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrWeeklyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrMonthlyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
        ltrYearlyRetention: { minValue: atLeast(0, () => hasRetentionStrategy.value) },
      }),
    },
  })

  const { getScopeTypeLabel, scopeTypeOptions } = useBackupJobScopeTypeOptions(() => t('all-objects-brs'))

  const distributionLabels = computed<Record<BackupJobBackupDistribution, string>>(() => ({
    every: t('store-backups-on-every-backup-repository'),
    distribute: t('distribute-backups-across-backup-repositories'),
  }))

  function getDistributionLabel(distribution: BackupJobBackupDistribution): string {
    return distributionLabels.value[distribution]
  }

  const distributionOptions = computed<BackupJobFormOption<BackupJobBackupDistribution>[]>(() => [
    { label: distributionLabels.value.every, value: 'every' },
    { label: distributionLabels.value.distribute, value: 'distribute' },
  ])

  const { id: targetProxySelectId } = useFormSelect('targetProxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const { hourOptions, weekDayOptions, monthDayOptions, monthOptions } = useScheduleCalendarOptions({
    weekDayFormat: 'long',
    withMinutes: true,
  })

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
    targetProxy: useSelect(targetProxySelectId, () => ({
      label: t('target-proxy'),
      info:
        formData.targetProxy !== undefined
          ? t('only-backup-repositories-using-this-proxy')
          : t('only-backup-repositories-without-proxy'),
    })),
    backupRepositoryScopeType: useField('backupRepositoryScopeType', () => ({
      label: t('scope-type'),
      options: scopeTypeOptions.value,
    })),
    backupRepositoryIds: useField('backupRepositoryIds'),
    backupRepositoryFilter: useField('backupRepositoryFilter'),
    backupDistribution: useField('backupDistribution', () => ({
      label: t('backup-distribution-strategy'),
      options: distributionOptions.value,
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
  })

  return {
    formData,
    bindings,
    availableBackupRepositories,
    compatibleBackupRepositories,
    matchedBackupRepositories,
    matchedBackupRepositoryItems,
    selectedBackupRepositoryItems,
    backupRepositorySchema,
    areBackupRepositoriesReady,
    getScopeTypeLabel,
    getDistributionLabel,
    getKeepLabel,
    validate,
    reset,
  }
}
