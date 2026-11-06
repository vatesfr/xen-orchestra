import {
  type BackupJobMirrorVm,
  useBackupJobMirrorVms,
} from '@/modules/backup-job/composables/use-backup-job-mirror-vms.composable.ts'
import { useBackupJobScopeTypeOptions } from '@/modules/backup-job/composables/use-backup-job-scope-type-options.composable.ts'
import type { BackupJobFormOption, BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryType } from '@/modules/backup-repository/utils/xo-backup-repository-type.util.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { usePoolQueryBuilder } from '@/modules/pool/composables/use-pool-query-builder.composable.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { toPoolQueryPreviewItem } from '@/modules/pool/utils/xo-pool-query-preview-item.util.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useVmEnhancedData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import { useVmQueryPreviewItems } from '@/modules/vm/composables/use-vm-query-preview-items.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toVmQueryPreviewItem } from '@/modules/vm/utils/xo-vm-query-preview-item.util.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { queryFilter, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobDataSource = 'vm' | 'mirror' | 'metadata'

export type BackupJobMode = 'delta' | 'full'

export type BackupJobSourceFormData = {
  name: string
  enabled: boolean
  dataSource: BackupJobDataSource
  mode: BackupJobMode
  saveXoConfig: boolean
  savePoolsMetadata: boolean
  proxy: FrontXoProxy['id'] | undefined
  sourceBackupRepository: FrontXoBackupRepository['id'] | undefined
  scopeType: BackupJobScopeType
  vmIds: FrontXoVm['id'][]
  vmFilter: string
  poolIds: FrontXoPool['id'][]
  poolFilter: string
}

export type BackupJobSourceForm = ReturnType<typeof useBackupJobSourceForm>

export function useBackupJobSourceForm(formData: BackupJobSourceFormData) {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const { backupRepositories } = useXoBackupRepositoryCollection()

  const { vms, areVmsReady } = useXoVmCollection()

  const { schema: vmSchema } = useVmQueryBuilder('backup-job-source-vms-schema', vms, { ignoreRoute: true })

  const { filterableVms } = useVmEnhancedData(vms)

  const { pools, arePoolsReady } = useXoPoolCollection()

  const { schema: poolSchema } = usePoolQueryBuilder('backup-job-source-pools-schema', pools, { ignoreRoute: true })

  const isMirror = computed(() => formData.dataSource === 'mirror')

  const isMetadata = computed(() => formData.dataSource === 'metadata')

  const isIncremental = computed(() => formData.mode === 'delta')

  const hasPoolSelection = computed(() => isMetadata.value && formData.savePoolsMetadata)

  const hasVmSelection = computed(() => formData.dataSource === 'vm' || isMirror.value)

  const { mirrorVms, mirrorVmSchema, areMirrorVmsReady } = useBackupJobMirrorVms(
    () => formData.sourceBackupRepository,
    () => formData.mode,
    isMirror
  )

  watch(
    () => [formData.sourceBackupRepository, formData.mode],
    () => {
      if (!isMirror.value) {
        return
      }

      formData.vmIds = []
      formData.vmFilter = ''
    }
  )

  const vmSelectionSchema = computed(() => (isMirror.value ? mirrorVmSchema : vmSchema))

  const matchedVms = computed(() => filterByQuery(filterableVms.value, formData.vmFilter))

  const selectedVms = computed(() => vms.value.filter(vm => formData.vmIds.includes(vm.id)))

  const matchedVmItems = useVmQueryPreviewItems(matchedVms)

  const selectedVmItems = useVmQueryPreviewItems(selectedVms)

  function toMirrorVmPreviewItems(mirrorVms: BackupJobMirrorVm[]): QueryBuilderPreviewItem[] {
    return mirrorVms.map(mirrorVm => toVmQueryPreviewItem(mirrorVm.id, mirrorVm.name_label, mirrorVm.powerState))
  }

  const matchedSelectionItems = computed(() =>
    isMirror.value ? toMirrorVmPreviewItems(filterByQuery(mirrorVms.value, formData.vmFilter)) : matchedVmItems.value
  )

  const selectedSelectionItems = computed(() =>
    isMirror.value
      ? toMirrorVmPreviewItems(mirrorVms.value.filter(mirrorVm => formData.vmIds.includes(mirrorVm.id)))
      : selectedVmItems.value
  )

  function toPoolPreviewItems(selectedPools: FrontXoPool[]): QueryBuilderPreviewItem[] {
    return selectedPools.map(pool => toPoolQueryPreviewItem(pool.id, pool.name_label))
  }

  const matchedPoolItems = computed(() => toPoolPreviewItems(filterByQuery(pools.value, formData.poolFilter)))

  const selectedPoolItems = computed(() =>
    toPoolPreviewItems(pools.value.filter(pool => formData.poolIds.includes(pool.id)))
  )

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: {
          required: withMessage(required, () => t('name-required')),
        },
        sourceBackupRepository: {
          requiredIf: withMessage(
            requiredIf(() => isMirror.value),
            () => t('source-backup-repository-mandatory')
          ),
        },
        vmIds: {
          atLeastOne: withMessage(
            () => !hasVmSelection.value || formData.scopeType !== 'manual' || formData.vmIds.length > 0,
            () => t('select-at-least-one-object')
          ),
        },
        vmFilter: {
          requiredIf: withMessage(
            requiredIf(() => hasVmSelection.value && formData.scopeType === 'smart'),
            () => t('query-required')
          ),
          queryFilter: withMessage(queryFilter, () => t('invalid-query')),
        },
        poolIds: {
          atLeastOne: withMessage(
            () => !hasPoolSelection.value || formData.scopeType !== 'manual' || formData.poolIds.length > 0,
            () => t('select-at-least-one-object')
          ),
        },
        poolFilter: {
          requiredIf: withMessage(
            requiredIf(() => hasPoolSelection.value && formData.scopeType === 'smart'),
            () => t('query-required')
          ),
          queryFilter: withMessage(queryFilter, () => t('invalid-query')),
        },
        savePoolsMetadata: {
          atLeastOneOption: withMessage(
            () => !isMetadata.value || formData.saveXoConfig || formData.savePoolsMetadata,
            () => t('select-at-least-one-option')
          ),
        },
      }),
    },
  })

  const dataSourceLabels = computed<Record<BackupJobDataSource, string>>(() => ({
    vm: t('vms-on-sr'),
    mirror: t('vms-on-br'),
    metadata: t('pool-metadata-and-xo-config'),
  }))

  function getDataSourceLabel(dataSource: BackupJobDataSource): string {
    return dataSourceLabels.value[dataSource]
  }

  const dataSourceOptions = computed<BackupJobFormOption<BackupJobDataSource>[]>(() => [
    { label: dataSourceLabels.value.vm, value: 'vm' },
    { label: dataSourceLabels.value.mirror, value: 'mirror' },
    { label: dataSourceLabels.value.metadata, value: 'metadata' },
  ])

  const modeLabels = computed<Record<BackupJobMode, string>>(() => ({
    delta: t('incremental'),
    full: t('full'),
  }))

  function getModeLabel(mode: BackupJobMode): string {
    return modeLabels.value[mode]
  }

  const modeOptions = computed<BackupJobFormOption<BackupJobMode>[]>(() => [
    { label: modeLabels.value.delta, value: 'delta' },
    { label: modeLabels.value.full, value: 'full' },
  ])

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const compatibleSourceBackupRepositories = computed(() =>
    backupRepositories.value.filter(br => br.proxy === formData.proxy)
  )

  watch(compatibleSourceBackupRepositories, brs => {
    if (formData.sourceBackupRepository !== undefined && !brs.some(br => br.id === formData.sourceBackupRepository)) {
      formData.sourceBackupRepository = undefined
    }
  })

  const { id: sourceBackupRepositorySelectId } = useFormSelect(
    'sourceBackupRepository',
    compatibleSourceBackupRepositories,
    {
      searchable: true,
      required: true,
      option: {
        label: 'name',
        value: 'id',
        properties: br => ({ icon: getBackupRepositoryIcon(br, getBackupRepositoryType(br.url)) }),
      },
    }
  )

  const { getScopeTypeLabel, scopeTypeOptions } = useBackupJobScopeTypeOptions(() =>
    isMetadata.value ? t('all-objects-pools') : t('all-objects-vms')
  )

  const bindings = reactive({
    name: useField('name', () => ({ label: t('name'), required: true })),
    enabled: useField('enabled'),
    dataSource: useField('dataSource', () => ({ label: t('data-source'), options: dataSourceOptions.value })),
    mode: useField('mode', () => ({ label: t('backup-mode'), options: modeOptions.value })),
    saveXoConfig: useField('saveXoConfig', () => ({ label: t('save-xo-config') })),
    savePoolsMetadata: useField('savePoolsMetadata', () => ({ label: t('save-pools-metadata') })),
    proxy: useSelect(proxySelectId, () => ({
      label: t('source-proxy'),
      info:
        formData.proxy !== undefined
          ? t('only-backup-repositories-using-this-proxy')
          : t('only-backup-repositories-without-proxy'),
    })),
    sourceBackupRepository: useSelect(sourceBackupRepositorySelectId, () => ({
      label: t('source-backup-repository'),
    })),
    vmIds: useField('vmIds'),
    vmFilter: useField('vmFilter'),
    poolIds: useField('poolIds'),
    poolFilter: useField('poolFilter'),
    scopeType: useField('scopeType', () => ({ label: t('scope-type'), options: scopeTypeOptions.value })),
  })

  return {
    formData,
    bindings,
    vms,
    areVmsReady,
    mirrorVms,
    mirrorVmSchema,
    areMirrorVmsReady,
    isMirror,
    isMetadata,
    isIncremental,
    hasVmSelection,
    vmSelectionSchema,
    matchedSelectionItems,
    selectedSelectionItems,
    pools,
    arePoolsReady,
    hasPoolSelection,
    poolSchema,
    matchedPoolItems,
    selectedPoolItems,
    validate,
    reset,
    getDataSourceLabel,
    getModeLabel,
    getScopeTypeLabel,
  }
}
