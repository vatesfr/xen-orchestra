import { outOfRange } from '@core/packages/form-validation'
import { defineRegleOptions } from '@regle/core'
import { integer, required, withMessage } from '@regle/rules'
import { useI18n } from 'vue-i18n'

export const regleOptions = defineRegleOptions({
  rules: () => {
    const { t } = useI18n()

    return {
      required: withMessage(required, () => t('form:error:required')),
      integer: withMessage(integer, () => t('form:error:integer')),
      outOfRange: withMessage(outOfRange, ({ $params: [min, max] }) => t('form:warning:out-of-range', { min, max })),
    }
  },
})
