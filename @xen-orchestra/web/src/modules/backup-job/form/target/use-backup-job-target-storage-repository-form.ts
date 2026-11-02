import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import type { BackupJobTargetScopeType } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import { useSrFormFilterableData } from '@/modules/storage-repository/composables/use-sr-form-query-builder.composable.ts'
import { type FrontXoSr, useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobReplicaDistribution = 'every' | 'distribute'

export type BackupJobTargetStorageRepositoryFormData = {
  storageRepositoryScopeType: BackupJobTargetScopeType
  storageRepositoryIds: FrontXoSr['id'][]
  storageRepositoryFilter: string
  replicaDistribution: BackupJobReplicaDistribution
  copyRetention: number | undefined
}

export type BackupJobTargetStorageRepositoryForm = ReturnType<typeof useBackupJobTargetStorageRepositoryForm>

export function useBackupJobTargetStorageRepositoryForm(
  formData: BackupJobTargetStorageRepositoryFormData,
  rawIsActive: MaybeRefOrGetter<boolean>
) {
  const { t } = useI18n()

  const isActive = toComputed(rawIsActive)

  const { srs } = useXoSrCollection()

  const availableStorageRepositories = computed(() => srs.value.filter(isSrWritable))

  const filterableStorageRepositories = useSrFormFilterableData(availableStorageRepositories)

  const matchedStorageRepositories = computed(() =>
    filterByQuery(filterableStorageRepositories.value, formData.storageRepositoryFilter)
  )

  const { atLeast } = useBackupJobFormRules()

  const { useField, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        storageRepositoryIds: {
          atLeastOne: withMessage(
            () =>
              !isActive.value ||
              formData.storageRepositoryScopeType !== 'manual' ||
              formData.storageRepositoryIds.length > 0,
            () => t('select-at-least-one-storage-repository')
          ),
        },
        storageRepositoryFilter: {
          atLeastOneMatch: withMessage(
            () =>
              !isActive.value ||
              formData.storageRepositoryScopeType !== 'smart' ||
              matchedStorageRepositories.value.length > 0,
            () => t('query-matches-no-storage-repository')
          ),
        },
        copyRetention: {
          requiredIf: withMessage(
            requiredIf(() => isActive.value),
            () => t('minimum-replicas-to-retain-mandatory')
          ),
          minValue: atLeast(1, () => isActive.value),
        },
      }),
    },
  })

  const scopeTypeLabels = computed<Record<BackupJobTargetScopeType, string>>(() => ({
    all: t('all-objects-srs'),
    manual: t('manual-selection'),
    smart: t('dynamic-selection'),
  }))

  function getScopeTypeLabel(scopeType: BackupJobTargetScopeType): string {
    return scopeTypeLabels.value[scopeType]
  }

  const scopeTypeOptions = computed<BackupJobFormOption<BackupJobTargetScopeType>[]>(() => [
    { label: scopeTypeLabels.value.all, value: 'all' },
    { label: scopeTypeLabels.value.manual, value: 'manual' },
    { label: scopeTypeLabels.value.smart, value: 'smart' },
  ])

  const distributionLabels = computed<Record<BackupJobReplicaDistribution, string>>(() => ({
    every: t('store-replicas-on-every-storage-repository'),
    distribute: t('distribute-replicas-across-storage-repositories'),
  }))

  function getDistributionLabel(distribution: BackupJobReplicaDistribution): string {
    return distributionLabels.value[distribution]
  }

  const distributionOptions = computed<BackupJobFormOption<BackupJobReplicaDistribution>[]>(() => [
    { label: distributionLabels.value.every, value: 'every' },
    { label: distributionLabels.value.distribute, value: 'distribute' },
  ])

  const bindings = reactive({
    storageRepositoryScopeType: useField('storageRepositoryScopeType', () => ({
      label: t('scope-type'),
      options: scopeTypeOptions.value,
    })),
    storageRepositoryIds: useField('storageRepositoryIds'),
    storageRepositoryFilter: useField('storageRepositoryFilter'),
    replicaDistribution: useField('replicaDistribution', () => ({
      label: t('replica-distribution-strategy'),
      options: distributionOptions.value,
    })),
    copyRetention: useField('copyRetention', () => ({
      label: t('minimum-replicas-to-retain'),
      required: true,
    })),
  })

  return {
    formData,
    bindings,
    availableStorageRepositories,
    matchedStorageRepositories,
    getScopeTypeLabel,
    getDistributionLabel,
    validate,
    reset,
  }
}
