import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobKeyBackup = 'never' | 'dynamic' | 'always'

export type BackupJobCompression = '' | 'native' | 'zstd'

export type BackupJobSnapshotMode = 'default' | 'with-memory' | 'offline'

export type BackupJobSnapshotSync = 'none' | 'all' | 'smart'

export type BackupJobTransferFormData = {
  maxExportRate: number | undefined
  concurrency: number | undefined
  compression: BackupJobCompression
  keyBackup: BackupJobKeyBackup
  keyBackupMonthDays: number[]
  keyBackupWeekDays: number[]
  keyBackupHours: number[]
  preferNbd: boolean
  nbdConcurrency: number | undefined
  offlineBackup: boolean
  snapshotMode: BackupJobSnapshotMode
  snapshotSync: BackupJobSnapshotSync
  snapshotSyncTag: string | undefined
  snapshotRetention: number | undefined
}

type RadioOption<TValue extends string> = { label: string; value: TValue; description?: string }

type ValueOption = { label: string; value: number }

export type BackupJobTransferForm = ReturnType<typeof useBackupJobTransferForm>

export function useBackupJobTransferForm(
  formData: BackupJobTransferFormData,
  rawIsIncremental: MaybeRefOrGetter<boolean>,
  rawIsMirror: MaybeRefOrGetter<boolean>
) {
  const { t, locale } = useI18n()

  const isIncremental = toComputed(rawIsIncremental)

  const isMirror = toComputed(rawIsMirror)

  const isNbdAvailable = computed(() => isIncremental.value && !isMirror.value)

  const isKeyBackupDynamic = computed(() => isIncremental.value && !isMirror.value && formData.keyBackup === 'dynamic')

  const hasSnapshotRetention = computed(() => !isMirror.value && !formData.offlineBackup)

  const isEphemeralSnapshotAllowed = computed(() => !isIncremental.value || formData.preferNbd)

  const { vms } = useXoVmCollection()

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        concurrency: {
          required: withMessage(required, () => t('vm-read-concurrency-mandatory')),
        },
        nbdConcurrency: {
          requiredIf: withMessage(
            requiredIf(() => isNbdAvailable.value && formData.preferNbd),
            () => t('nbd-concurrency-per-disk-mandatory')
          ),
          minValue: withMessage(
            (value: unknown) => !isNbdAvailable.value || !formData.preferNbd || typeof value !== 'number' || value >= 1,
            () => t('must-be-at-least-n', { n: 1 })
          ),
        },
        keyBackupMonthDays: {
          requiredIf: withMessage(
            requiredIf(() => isKeyBackupDynamic.value && formData.keyBackupWeekDays.length === 0),
            () => t('select-at-least-one-day')
          ),
        },
        keyBackupHours: {
          requiredIf: withMessage(
            requiredIf(() => isKeyBackupDynamic.value),
            () => t('select-at-least-one-hour')
          ),
        },
        snapshotSyncTag: {
          requiredIf: requiredIf(() => !isMirror.value && !formData.offlineBackup && formData.snapshotSync === 'smart'),
        },
        snapshotRetention: {
          requiredIf: withMessage(
            requiredIf(() => hasSnapshotRetention.value),
            () => t('minimum-snapshots-to-retain-mandatory')
          ),
          minValue: withMessage(
            (value: unknown) => !hasSnapshotRetention.value || typeof value !== 'number' || value >= 0,
            () => t('must-be-at-least-n', { n: 0 })
          ),
          ephemeralSnapshot: withMessage(
            (value: unknown) => !hasSnapshotRetention.value || value !== 0 || isEphemeralSnapshotAllowed.value,
            () => t('ephemeral-snapshot-requires-nbd')
          ),
        },
      }),
    },
  })

  const compressionOptions = computed<RadioOption<BackupJobCompression>[]>(() => [
    { label: t('none'), value: '' },
    { label: t('gzip'), value: 'native' },
    { label: t('zstd'), value: 'zstd' },
  ])

  const keyBackupOptions = computed<RadioOption<BackupJobKeyBackup>[]>(() => [
    { label: t('never'), value: 'never' },
    { label: t('dynamic-selection'), value: 'dynamic' },
    { label: t('always'), value: 'always' },
  ])

  const monthDayOptions = computed<ValueOption[]>(() =>
    Array.from({ length: 31 }, (_, day) => ({ label: String(day + 1), value: day + 1 }))
  )

  const weekDayOptions = computed<ValueOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' })

    return [1, 2, 3, 4, 5, 6, 0].map(day => ({ label: format.format(Date.UTC(2024, 0, 7 + day)), value: day }))
  })

  const hourOptions = computed<ValueOption[]>(() =>
    Array.from({ length: 24 }, (_, hour) => ({ label: String(hour).padStart(2, '0'), value: hour }))
  )

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
      info: t('value-by-default', { value: 2 }),
    })),
    compression: useField('compression', () => ({ label: t('compression-type'), options: compressionOptions.value })),
    keyBackup: useField('keyBackup', () => ({ label: t('key-backup'), options: keyBackupOptions.value })),
    keyBackupMonthDays: useField('keyBackupMonthDays', () => ({
      label: t('days-of-the-month'),
      options: monthDayOptions.value,
    })),
    keyBackupWeekDays: useField('keyBackupWeekDays', () => ({
      label: t('days-of-the-week'),
      options: weekDayOptions.value,
    })),
    keyBackupHours: useField('keyBackupHours', () => ({ label: t('hours'), options: hourOptions.value })),
    preferNbd: useField('preferNbd', () => ({ label: t('network-block-device-nbd'), info: t('nbd-backup-info') })),
    nbdConcurrency: useField('nbdConcurrency', () => ({
      label: t('nbd-concurrency-per-disk'),
      required: true,
      info: t('value-by-default', { value: 1 }),
    })),
    offlineBackup: useField('offlineBackup', () => ({ label: t('offline-backup'), info: t('offline-backup-info') })),
    snapshotMode: useField('snapshotMode', () => ({ label: t('snapshot-mode'), options: snapshotModeOptions.value })),
    snapshotSync: useField('snapshotSync', () => ({
      label: t('snapshot-synchronisation'),
      options: snapshotSyncOptions.value,
    })),
    snapshotSyncTag: useSelect(snapshotSyncTagSelectId, () => ({ label: t('tag') })),
    snapshotRetention: useField('snapshotRetention', () => ({ label: t('minimum-snapshots-to-retain') })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
