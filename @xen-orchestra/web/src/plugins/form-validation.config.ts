import {
  defineFormValidationConfig,
  integer,
  outOfRange,
  queryFilter,
  required,
  requiredIf,
  withMessage,
} from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

export const formValidationConfig = defineFormValidationConfig({
  rules: () => {
    const { t } = useI18n()

    return {
      integer: withMessage(integer, () => t('form:error:integer')),
      outOfRange: withMessage(outOfRange, ({ $params: [min, max] }) => t('form:warning:out-of-range', { min, max })),
      queryFilter: withMessage(queryFilter, () => t('form:error:invalid-query')),
      required: withMessage(required, () => t('form:error:required')),
      requiredIf: withMessage(requiredIf, () => t('form:error:required')),
    }
  },
})
