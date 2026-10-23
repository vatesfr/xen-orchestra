import { type FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobDataSource = 'vm' | 'mirror' | 'metadata'

export type BackupJobMode = 'delta' | 'full'

export type BackupJobScopeType = 'all' | 'manual' | 'smart'

export type BackupJobBackupRepositorySourceType = 'manual' | 'smart'

export type BackupJobSourceFormData = {
  dataSource: BackupJobDataSource
  mode: BackupJobMode
  proxy: FrontXoProxy['id'] | undefined
  backupRepositorySourceType: BackupJobBackupRepositorySourceType
  scopeType: BackupJobScopeType
}

type RadioOption<TValue extends string> = { label: string; value: TValue }

export type BackupJobSourceForm = ReturnType<typeof useBackupJobSourceForm>

export function useBackupJobSourceForm(formData: BackupJobSourceFormData) {
  const { t } = useI18n()

  const { proxies } = useXoProxyCollection()

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {})

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

  const backupRepositorySourceTypeOptions = computed<RadioOption<BackupJobBackupRepositorySourceType>[]>(() => [
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const scopeTypeOptions = computed<RadioOption<BackupJobScopeType>[]>(() => [
    { label: t('all-objects-vms'), value: 'all' },
    { label: t('manual-selection'), value: 'manual' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const bindings = reactive({
    dataSource: useField('dataSource', () => ({ label: t('data-source'), options: dataSourceOptions.value })),
    mode: useField('mode', () => ({ label: t('backup-mode'), options: modeOptions.value })),
    proxy: useSelect(proxySelectId, () => ({ label: t('proxy') })),
    backupRepositorySourceType: useField('backupRepositorySourceType', () => ({
      label: t('backup-repository-source'),
      options: backupRepositorySourceTypeOptions.value,
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
