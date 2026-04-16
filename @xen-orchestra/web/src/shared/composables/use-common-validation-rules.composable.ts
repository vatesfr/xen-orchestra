import { isFilled, required, type Maybe, withMessage } from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

/**
 * Returns pre-built rule helpers with default translated messages.
 *
 * Each helper is a getter function so the message stays reactive across locale changes.
 * Override by passing `withMessage(required, t('custom.key'))` directly where needed.
 *
 * Usage:
 * ```ts
 * const { requiredRule, outOfRangeRule } = useCommonValidationRules()
 *
 * errors: () => ({
 *   name: { required: requiredRule() },
 *   // override for a specific field:
 *   pif: { required: withMessage(required, t('select-an-interface')) },
 * }),
 * warnings: {
 *   onBlur: () => ({
 *     port: { outOfRange: outOfRangeRule(1, 65535) },
 *   }),
 * },
 * ```
 */
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
