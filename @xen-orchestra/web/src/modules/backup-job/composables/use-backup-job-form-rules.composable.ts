import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

export function useBackupJobFormRules() {
  const { t } = useI18n()

  function atLeast(min: number, isActive: () => boolean) {
    return withMessage(
      (value: unknown) => !isActive() || typeof value !== 'number' || value >= min,
      () => t('must-be-at-least-n', { n: min })
    )
  }

  function calendarRules(isActive: () => boolean, getWeekDays: () => number[]) {
    return {
      monthDays: {
        requiredIf: withMessage(
          requiredIf(() => isActive() && getWeekDays().length === 0),
          () => t('select-at-least-one-day')
        ),
      },
      hours: {
        requiredIf: withMessage(requiredIf(isActive), () => t('select-at-least-one-hour')),
      },
    }
  }

  return {
    atLeast,
    calendarRules,
  }
}
