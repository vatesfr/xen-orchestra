import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobDataSource = 'vm' | 'mirror' | 'metadata'

export type BackupJobMode = 'delta' | 'full'

export type BackupJobScopeType = 'all' | 'manual' | 'smart'

export type BackupJobSourceFormData = {
  dataSource: BackupJobDataSource
  mode: BackupJobMode
  saveXoConfig: boolean
  savePoolsMetadata: boolean
  proxy: FrontXoProxy['id'] | undefined
  sourceBackupRepository: FrontXoBackupRepository['id'] | undefined
  scopeType: BackupJobScopeType
}

type RadioOption<TValue extends string> = { label: string; value: TValue }

export type BackupJobSourceForm = ReturnType<typeof useBackupJobSourceForm>

export function useBackupJobSourceForm(formData: BackupJobSourceFormData) {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const { backupRepositories } = useXoBackupRepositoryCollection()

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        sourceBackupRepository: {
          requiredIf: requiredIf(() => formData.dataSource === 'mirror'),
        },
        savePoolsMetadata: {
          atLeastOneOption: withMessage(
            () => formData.dataSource !== 'metadata' || formData.saveXoConfig || formData.savePoolsMetadata,
            () => t('select-at-least-one-option')
          ),
        },
      }),
    },
  })

  const dataSourceOptions = computed<RadioOption<BackupJobDataSource>[]>(() => [
    { label: t('vms-on-sr'), value: 'vm' },
    { label: t('vms-on-br'), value: 'mirror' },
    { label: t('pool-metadata-and-xo-config'), value: 'metadata' },
  ])

  const modeOptions = computed<RadioOption<BackupJobMode>[]>(() => [
    { label: t('incremental'), value: 'delta' },
    { label: t('full'), value: 'full' },
  ])

  const { id: proxySelectId } = useFormSelect('proxy', proxies, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: { label: 'name', value: 'id' },
  })

  const { id: sourceBackupRepositorySelectId } = useFormSelect('sourceBackupRepository', backupRepositories, {
    searchable: true,
    required: true,
    option: { label: 'name', value: 'id' },
  })

  const scopeTypeOptions = computed<RadioOption<BackupJobScopeType>[]>(() => [
    { label: formData.dataSource === 'metadata' ? t('all-objects-pools') : t('all-objects-vms'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const bindings = reactive({
    dataSource: useField('dataSource', () => ({ label: t('data-source'), options: dataSourceOptions.value })),
    mode: useField('mode', () => ({ label: t('backup-mode'), options: modeOptions.value })),
    saveXoConfig: useField('saveXoConfig', () => ({ label: t('save-xo-config') })),
    savePoolsMetadata: useField('savePoolsMetadata', () => ({ label: t('save-pools-metadata') })),
    proxy: useSelect(proxySelectId, () => ({ label: t('source-proxy') })),
    sourceBackupRepository: useSelect(sourceBackupRepositorySelectId, () => ({
      label: t('source-backup-repository'),
    })),
    scopeType: useField('scopeType', () => ({ label: t('scope-type'), options: scopeTypeOptions.value })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
