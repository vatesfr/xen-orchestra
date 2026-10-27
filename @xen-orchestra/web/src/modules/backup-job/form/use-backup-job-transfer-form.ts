import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobKeyBackup = 'never' | 'dynamic' | 'always'

export type BackupJobSnapshotMode = 'default' | 'with-memory' | 'offline'

export type BackupJobSnapshotSync = 'none' | 'all' | 'smart'

export type BackupJobTransferFormData = {
  maxExportRate: number | undefined
  concurrency: number | undefined
  keyBackup: BackupJobKeyBackup
  preferNbd: boolean
  nbdConcurrency: number | undefined
  snapshotMode: BackupJobSnapshotMode
  snapshotSync: BackupJobSnapshotSync
  snapshotSyncTag: string | undefined
}

type RadioOption<TValue extends string> = { label: string; value: TValue; description?: string }

export type BackupJobTransferForm = ReturnType<typeof useBackupJobTransferForm>

export function useBackupJobTransferForm(formData: BackupJobTransferFormData) {
  const { t } = useI18n()

  const { vms } = useXoVmCollection()

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        concurrency: {
          required: withMessage(required, () => t('vm-read-concurrency-mandatory')),
        },
        nbdConcurrency: {
          requiredIf: withMessage(
            requiredIf(() => formData.preferNbd),
            () => t('nbd-concurrency-per-disk-mandatory')
          ),
          minValue: withMessage(
            (value: number | undefined) => !formData.preferNbd || typeof value !== 'number' || value >= 1,
            () => t('must-be-at-least-n', { n: 1 })
          ),
        },
        snapshotSyncTag: {
          requiredIf: requiredIf(() => formData.snapshotSync === 'smart'),
        },
      }),
    },
  })

  const keyBackupOptions = computed<RadioOption<BackupJobKeyBackup>[]>(() => [
    { label: t('never'), value: 'never' },
    { label: t('dynamic-selection'), value: 'dynamic' },
    { label: t('always'), value: 'always' },
  ])

  const snapshotModeOptions = computed<RadioOption<BackupJobSnapshotMode>[]>(() => [
    { label: t('default'), value: 'default', description: t('snapshot-mode:default-description') },
    { label: t('with-memory'), value: 'with-memory', description: t('snapshot-mode:with-memory-description') },
    { label: t('offline'), value: 'offline', description: t('snapshot-mode:offline-description') },
  ])

  const snapshotSyncOptions = computed<RadioOption<BackupJobSnapshotSync>[]>(() => [
    { label: t('none'), value: 'none' },
    { label: t('all-objects-vms'), value: 'all' },
    { label: t('dynamic-selection'), value: 'smart' },
  ])

  const vmTags = computed(() => [...new Set(vms.value.flatMap(vm => vm.tags))].sort())

  const { id: snapshotSyncTagSelectId } = useFormSelect('snapshotSyncTag', vmTags, {
    searchable: true,
    required: true,
  })

  const bindings = reactive({
    maxExportRate: useField('maxExportRate', () => ({ label: t('source-speed-limit') })),
    concurrency: useField('concurrency', () => ({
      label: t('vm-read-concurrency'),
      required: true,
    })),
    keyBackup: useField('keyBackup', () => ({ label: t('key-backup'), options: keyBackupOptions.value })),
    preferNbd: useField('preferNbd', () => ({ label: t('network-block-device-nbd'), info: t('nbd-backup-info') })),
    nbdConcurrency: useField('nbdConcurrency', () => ({
      label: t('nbd-concurrency-per-disk'),
      required: true,
    })),
    snapshotMode: useField('snapshotMode', () => ({ label: t('snapshot-mode'), options: snapshotModeOptions.value })),
    snapshotSync: useField('snapshotSync', () => ({
      label: t('snapshot-synchronisation'),
      options: snapshotSyncOptions.value,
    })),
    snapshotSyncTag: useSelect(snapshotSyncTagSelectId, () => ({ label: t('tag') })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
