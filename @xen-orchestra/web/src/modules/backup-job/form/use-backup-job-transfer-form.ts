import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobKeyBackup = 'never' | 'dynamic' | 'always'

export type BackupJobSnapshotMode = 'default' | 'with-memory' | 'offline'

export type BackupJobSnapshotSync = 'disabled' | 'enabled'

export type BackupJobTransferFormData = {
  maxExportRate: number | undefined
  concurrency: number | undefined
  keyBackup: BackupJobKeyBackup
  keyBackupFilter: string
  preferNbd: boolean
  nbdConcurrency: number | undefined
  snapshotMode: BackupJobSnapshotMode
  snapshotSync: BackupJobSnapshotSync
}

type RadioOption<TValue extends string> = { label: string; value: TValue; description?: string }

export type BackupJobTransferForm = ReturnType<typeof useBackupJobTransferForm>

export function useBackupJobTransferForm(formData: BackupJobTransferFormData) {
  const { t } = useI18n()

  const { useField, validate, reset } = useValidatedForm(formData, {})

  const keyBackupOptions = computed<RadioOption<BackupJobKeyBackup>[]>(() => [
    { label: t('never'), value: 'never' },
    { label: t('dynamic-selection'), value: 'dynamic' },
    { label: t('always'), value: 'always' },
  ])

  const keyBackupFilterSchema = useQueryBuilderSchema<FrontXoVm>({
    '': useStringSchema(t('any-property')),
  })

  const snapshotModeOptions = computed<RadioOption<BackupJobSnapshotMode>[]>(() => [
    { label: t('default'), value: 'default', description: t('snapshot-mode:default-description') },
    { label: t('with-memory'), value: 'with-memory', description: t('snapshot-mode:with-memory-description') },
    { label: t('offline'), value: 'offline', description: t('snapshot-mode:offline-description') },
  ])

  const snapshotSyncOptions = computed<RadioOption<BackupJobSnapshotSync>[]>(() => [
    { label: t('disabled'), value: 'disabled' },
    { label: t('enabled'), value: 'enabled' },
  ])

  const bindings = reactive({
    maxExportRate: useField('maxExportRate', () => ({ label: t('source-speed-limit') })),
    concurrency: useField('concurrency', () => ({
      label: t('vm-read-concurrency'),
      required: true,
      info: t('value-by-default', { value: 2 }),
    })),
    keyBackup: useField('keyBackup', () => ({ label: t('key-backup'), options: keyBackupOptions.value })),
    keyBackupFilter: useField('keyBackupFilter', () => ({ schema: keyBackupFilterSchema })),
    preferNbd: useField('preferNbd', () => ({ label: t('network-block-device-nbd'), info: t('nbd-backup-info') })),
    nbdConcurrency: useField('nbdConcurrency', () => ({
      label: t('nbd-concurrency-per-disk'),
      required: true,
      info: t('value-by-default', { value: 1 }),
    })),
    snapshotMode: useField('snapshotMode', () => ({ label: t('snapshot-mode'), options: snapshotModeOptions.value })),
    snapshotSync: useField('snapshotSync', () => ({
      label: t('snapshot-synchronisation'),
      options: snapshotSyncOptions.value,
    })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
