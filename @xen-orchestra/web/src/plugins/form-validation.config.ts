import {
  defineFormValidationConfig,
  integer,
  outOfRange,
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
      required: withMessage(required, () => t('form:error:required')),
      requiredIf: withMessage(requiredIf, () => t('form:error:required')),
    }
  },
})
