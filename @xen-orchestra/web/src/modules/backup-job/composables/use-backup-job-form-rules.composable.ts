import { applyIf, minValue, queryFilter, requiredIf, withMessage } from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

export function useBackupJobFormRules() {
  const { t } = useI18n()

  function atLeast(min: number, isActive: () => boolean) {
    return withMessage(applyIf(isActive, minValue(min)), () => t('must-be-at-least-n', { n: min }))
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

  function dynamicSelectionRules(isActive: () => boolean, noMatch?: { isEmpty: () => boolean; message: () => string }) {
    return {
      requiredIf: withMessage(requiredIf(isActive), () => t('query-required')),
      queryFilter: withMessage(queryFilter, () => t('invalid-query')),
      ...(noMatch !== undefined && {
        atLeastOneMatch: withMessage(() => !isActive() || !noMatch.isEmpty(), noMatch.message),
      }),
    }
  }

  return {
    atLeast,
    calendarRules,
    dynamicSelectionRules,
  }
}
