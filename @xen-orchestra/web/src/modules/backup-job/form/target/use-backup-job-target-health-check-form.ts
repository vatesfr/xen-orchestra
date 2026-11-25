import { useBackupJobFormRules } from '@/modules/backup-job/composables/use-backup-job-form-rules.composable.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/types/backup-job-form.type.ts'
import { useScheduleCalendarOptions } from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { type FrontXoSr, useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { useVmTags } from '@/modules/vm/composables/use-vm-tags.composable.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobHealthCheckSchedule = 'always' | 'dynamic'

export type BackupJobTargetHealthCheckFormData = {
  healthCheckEnabled: boolean
  healthCheckSr: FrontXoSr['id'] | undefined
  healthCheckVmTags: string[]
  healthCheckTimeout: number | undefined
  healthCheckSchedule: BackupJobHealthCheckSchedule
  healthCheckMonthDays: number[]
  healthCheckWeekDays: number[]
  healthCheckHours: number[]
}

export type BackupJobTargetHealthCheckForm = ReturnType<typeof useBackupJobTargetHealthCheckForm>

export function useBackupJobTargetHealthCheckForm(
  formData: BackupJobTargetHealthCheckFormData,
  rawIsActive: MaybeRefOrGetter<boolean>
) {
  const { t } = useI18n()

  const isActive = toComputed(rawIsActive)

  const isEnabled = computed(() => isActive.value && formData.healthCheckEnabled)

  const isDynamic = computed(() => isEnabled.value && formData.healthCheckSchedule === 'dynamic')

  const { srs } = useXoSrCollection()

  const availableStorageRepositories = computed(() => srs.value.filter(isSrWritable))

  const vmTags = useVmTags()

  const { atLeast, calendarRules } = useBackupJobFormRules()

  const healthCheckCalendarRules = calendarRules(
    () => isDynamic.value,
    () => formData.healthCheckWeekDays
  )

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        healthCheckSr: {
          requiredIf: withMessage(
            requiredIf(() => isEnabled.value),
            () => t('health-check-sr-mandatory')
          ),
        },
        healthCheckTimeout: {
          requiredIf: withMessage(
            requiredIf(() => isEnabled.value),
            () => t('health-check-timeout-mandatory')
          ),
          minValue: atLeast(1, () => isEnabled.value),
        },
        healthCheckMonthDays: healthCheckCalendarRules.monthDays,
        healthCheckHours: healthCheckCalendarRules.hours,
      }),
    },
  })

  const scheduleLabels = computed<Record<BackupJobHealthCheckSchedule, string>>(() => ({
    always: t('always'),
    dynamic: t('dynamic-selection'),
  }))

  function getScheduleLabel(schedule: BackupJobHealthCheckSchedule): string {
    return scheduleLabels.value[schedule]
  }

  const scheduleOptions = computed<BackupJobFormOption<BackupJobHealthCheckSchedule>[]>(() => [
    { label: scheduleLabels.value.always, value: 'always' },
    { label: scheduleLabels.value.dynamic, value: 'dynamic' },
  ])

  const { monthDayOptions, weekDayOptions, hourOptions } = useScheduleCalendarOptions()

  const { getSrStatusIcon } = useXoSrUtils()

  const { id: healthCheckSrSelectId } = useFormSelect('healthCheckSr', availableStorageRepositories, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'id',
      properties: sr => ({ icon: getSrStatusIcon(sr) }),
    },
  })

  const { id: healthCheckVmTagsSelectId } = useFormSelect('healthCheckVmTags', vmTags, {
    searchable: true,
    multiple: true,
  })

  const bindings = reactive({
    healthCheckEnabled: useField('healthCheckEnabled', () => ({
      label: t('enable-health-check'),
      info: t('health-check-info'),
    })),
    healthCheckSr: useSelect(healthCheckSrSelectId, () => ({ label: t('health-check-sr') })),
    healthCheckVmTags: useSelect(healthCheckVmTagsSelectId, () => ({
      label: t('health-check-vm-tags'),
      info: t('health-check-vm-tags-info'),
    })),
    healthCheckTimeout: useField('healthCheckTimeout', () => ({
      label: t('timeout'),
      required: true,
      unit: t('cron:unit:minute'),
    })),
    healthCheckSchedule: useField('healthCheckSchedule', () => ({
      label: t('health-check-frequency'),
      options: scheduleOptions.value,
    })),
    healthCheckMonthDays: useField('healthCheckMonthDays', () => ({
      label: t('days-of-the-month'),
      options: monthDayOptions.value,
    })),
    healthCheckWeekDays: useField('healthCheckWeekDays', () => ({
      label: t('days-of-the-week'),
      options: weekDayOptions.value,
    })),
    healthCheckHours: useField('healthCheckHours', () => ({
      label: t('hours'),
      options: hourOptions.value,
    })),
  })

  return {
    formData,
    bindings,
    getScheduleLabel,
    validate,
    reset,
  }
}
