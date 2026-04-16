import { isFilled, required, type Maybe, withMessage } from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

export function useCommonValidationRules() {
  const { t } = useI18n()

  const requiredRule = () => withMessage(required, t('form:error:required'))

  const outOfRangeRule = (min: number, max: number) =>
    withMessage(
      (value: Maybe<number>) => !isFilled(value) || (value >= min && value <= max),
      t('form:warning:out-of-range', { min, max })
    )

  return { requiredRule, outOfRangeRule }
}
