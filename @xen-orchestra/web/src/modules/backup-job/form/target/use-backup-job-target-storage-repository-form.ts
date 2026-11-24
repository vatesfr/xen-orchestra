import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import { useBackupJobScopeTypeOptions } from '@/modules/backup-job/composables/use-backup-job-scope-type-options.composable.ts'
import type { BackupJobFormOption, BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  type SrExpressionContext,
  toSrExpressionContext,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { type FrontXoSr, useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toSrQueryPreviewItem } from '@/modules/storage-repository/utils/xo-sr-query-preview-item.util.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobReplicaDistribution = 'every' | 'distribute'

export type BackupJobTargetStorageRepositoryFormData = {
  storageRepositoryScopeType: BackupJobScopeType
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

  const { srs, areSrsReady } = useXoSrCollection()

  const availableStorageRepositories = computed(() => srs.value.filter(isSrWritable))

  const matchedStorageRepositories = computed(() =>
    filterByQuery(availableStorageRepositories.value, formData.storageRepositoryFilter, toSrExpressionContext)
  )

  const storageRepositorySchema = useQueryBuilderSchema<SrExpressionContext>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    description: useStringSchema(t('description')),
    type: useStringSchema(t('storage-format')),
    tags: useStringSchema(t('tags')),
  })

  const { getSrStatusIcon } = useXoSrUtils()

  const matchedStorageRepositoryItems = computed(() =>
    matchedStorageRepositories.value.map(sr => toSrQueryPreviewItem(sr, getSrStatusIcon(sr)))
  )

  const selectedStorageRepositoryItems = computed(() =>
    availableStorageRepositories.value
      .filter(sr => formData.storageRepositoryIds.includes(sr.id))
      .map(sr => toSrQueryPreviewItem(sr, getSrStatusIcon(sr)))
  )

  const { atLeast, dynamicSelectionRules } = useBackupJobFormRules()

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
        storageRepositoryFilter: dynamicSelectionRules(
          () => isActive.value && formData.storageRepositoryScopeType === 'smart',
          {
            isEmpty: () => matchedStorageRepositories.value.length === 0,
            message: () => t('query-matches-no-storage-repository'),
          }
        ),
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

  const { getScopeTypeLabel, scopeTypeOptions } = useBackupJobScopeTypeOptions(() => t('all-objects-srs'))

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
    matchedStorageRepositoryItems,
    selectedStorageRepositoryItems,
    storageRepositorySchema,
    areSrsReady,
    getScopeTypeLabel,
    getDistributionLabel,
    validate,
    reset,
  }
}
