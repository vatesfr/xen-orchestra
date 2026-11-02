import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { useScheduleCalendarOptions } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
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

export type BackupJobTransferForm = ReturnType<typeof useBackupJobTransferForm>

export function useBackupJobTransferForm(
  formData: BackupJobTransferFormData,
  rawIsIncremental: MaybeRefOrGetter<boolean>,
  rawIsMirror: MaybeRefOrGetter<boolean>
) {
  const { t } = useI18n()

  const isIncremental = toComputed(rawIsIncremental)

  const isMirror = toComputed(rawIsMirror)

  const isNbdAvailable = computed(() => isIncremental.value && !isMirror.value)

  const isKeyBackupDynamic = computed(() => isIncremental.value && !isMirror.value && formData.keyBackup === 'dynamic')

  const hasSnapshotRetention = computed(() => !isMirror.value && !formData.offlineBackup)

  const isEphemeralSnapshotAllowed = computed(() => !isIncremental.value || formData.preferNbd)

  const { vms } = useXoVmCollection()

  const { atLeast, calendarRules } = useBackupJobFormRules()

  const keyBackupRules = calendarRules(
    () => isKeyBackupDynamic.value,
    () => formData.keyBackupWeekDays
  )

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
          minValue: atLeast(1, () => isNbdAvailable.value && formData.preferNbd),
        },
        keyBackupMonthDays: keyBackupRules.monthDays,
        keyBackupHours: keyBackupRules.hours,
        snapshotSyncTag: {
          requiredIf: requiredIf(() => !isMirror.value && !formData.offlineBackup && formData.snapshotSync === 'smart'),
        },
        snapshotRetention: {
          requiredIf: withMessage(
            requiredIf(() => hasSnapshotRetention.value),
            () => t('minimum-snapshots-to-retain-mandatory')
          ),
          minValue: atLeast(0, () => hasSnapshotRetention.value),
          ephemeralSnapshot: withMessage(
            (value: unknown) => !hasSnapshotRetention.value || value !== 0 || isEphemeralSnapshotAllowed.value,
            () => t('ephemeral-snapshot-requires-nbd')
          ),
        },
      }),
    },
  })

  const compressionLabels = computed<Record<BackupJobCompression, string>>(() => ({
    '': t('none'),
    native: t('gzip'),
    zstd: t('zstd'),
  }))

  function getCompressionLabel(compression: BackupJobCompression): string {
    return compressionLabels.value[compression]
  }

  const compressionOptions = computed<BackupJobFormOption<BackupJobCompression>[]>(() => [
    { label: compressionLabels.value[''], value: '' },
    { label: compressionLabels.value.native, value: 'native' },
    { label: compressionLabels.value.zstd, value: 'zstd' },
  ])

  const keyBackupLabels = computed<Record<BackupJobKeyBackup, string>>(() => ({
    never: t('never'),
    dynamic: t('dynamic-selection'),
    always: t('always'),
  }))

  function getKeyBackupLabel(keyBackup: BackupJobKeyBackup): string {
    return keyBackupLabels.value[keyBackup]
  }

  const keyBackupOptions = computed<BackupJobFormOption<BackupJobKeyBackup>[]>(() => [
    { label: keyBackupLabels.value.never, value: 'never' },
    { label: keyBackupLabels.value.dynamic, value: 'dynamic' },
    { label: keyBackupLabels.value.always, value: 'always' },
  ])

  const { monthDayOptions, weekDayOptions, hourOptions } = useScheduleCalendarOptions()

  const snapshotModeLabels = computed<Record<BackupJobSnapshotMode, string>>(() => ({
    default: t('default'),
    'with-memory': t('with-memory'),
    offline: t('offline'),
  }))

  function getSnapshotModeLabel(snapshotMode: BackupJobSnapshotMode): string {
    return snapshotModeLabels.value[snapshotMode]
  }

  const snapshotModeOptions = computed<BackupJobFormOption<BackupJobSnapshotMode>[]>(() => [
    {
      label: snapshotModeLabels.value.default,
      value: 'default',
      description: t('snapshot-mode:default-description'),
    },
    {
      label: snapshotModeLabels.value['with-memory'],
      value: 'with-memory',
      description: t('snapshot-mode:with-memory-description'),
    },
    {
      label: snapshotModeLabels.value.offline,
      value: 'offline',
      description: t('snapshot-mode:offline-description'),
    },
  ])

  const snapshotSyncLabels = computed<Record<BackupJobSnapshotSync, string>>(() => ({
    none: t('none'),
    all: t('all-objects-vms'),
    smart: t('dynamic-selection'),
  }))

  function getSnapshotSyncLabel(snapshotSync: BackupJobSnapshotSync): string {
    return snapshotSyncLabels.value[snapshotSync]
  }

  const snapshotSyncOptions = computed<BackupJobFormOption<BackupJobSnapshotSync>[]>(() => [
    { label: snapshotSyncLabels.value.none, value: 'none' },
    { label: snapshotSyncLabels.value.all, value: 'all' },
    { label: snapshotSyncLabels.value.smart, value: 'smart' },
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
    getCompressionLabel,
    getKeyBackupLabel,
    getSnapshotModeLabel,
    getSnapshotSyncLabel,
  }
}
