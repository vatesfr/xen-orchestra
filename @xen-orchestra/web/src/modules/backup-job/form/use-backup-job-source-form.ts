import {
  type BackupJobMirrorVm,
  useBackupJobMirrorVms,
} from '@/modules/backup-job/composables/use-backup-job-mirror-vms.composable.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryType } from '@/modules/backup-repository/utils/xo-backup-repository-type.util.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useVmEnhancedData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import { useVmQueryPreviewItems } from '@/modules/vm/composables/use-vm-query-preview-items.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toVmQueryPreviewItem } from '@/modules/vm/utils/xo-vm-query-preview-item.util.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobDataSource = 'vm' | 'mirror' | 'metadata'

export type BackupJobMode = 'delta' | 'full'

export type BackupJobScopeType = 'all' | 'manual' | 'smart'

export type BackupJobSourceFormData = {
  name: string
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

  const { vms } = useXoVmCollection()

  const { schema: vmSchema } = useVmQueryBuilder('backup-job-source-vms-schema', vms, { ignoreRoute: true })

  const { filterableVms } = useVmEnhancedData(vms)

  const { pools } = useXoPoolCollection()

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
    () => [formData.dataSource, formData.sourceBackupRepository, formData.mode],
    () => {
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

  const poolSchema = useQueryBuilderSchema<FrontXoPool>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    tags: useStringSchema(t('tags')),
  })

  function toPoolPreviewItems(selectedPools: FrontXoPool[]): QueryBuilderPreviewItem[] {
    return selectedPools.map(pool => ({
      id: pool.id,
      label: pool.name_label,
      icon: 'object:pool',
      route: `/pool/${pool.id}/dashboard`,
    }))
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
          requiredIf: requiredIf(() => isMirror.value),
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

  const dataSourceOptions = computed<BackupJobFormOption<BackupJobDataSource>[]>(() => [
    { label: t('vms-on-sr'), value: 'vm' },
    { label: t('vms-on-br'), value: 'mirror' },
    { label: t('pool-metadata-and-xo-config'), value: 'metadata' },
  ])

  const modeOptions = computed<BackupJobFormOption<BackupJobMode>[]>(() => [
    { label: t('incremental'), value: 'delta' },
    { label: t('full'), value: 'full' },
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

  const scopeTypeOptions = computed<BackupJobFormOption<BackupJobScopeType>[]>(() => [
    { label: isMetadata.value ? t('all-objects-pools') : t('all-objects-vms'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const bindings = reactive({
    name: useField('name', () => ({ label: t('name'), required: true })),
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
    hasPoolSelection,
    poolSchema,
    matchedPoolItems,
    selectedPoolItems,
    validate,
    reset,
  }
}
