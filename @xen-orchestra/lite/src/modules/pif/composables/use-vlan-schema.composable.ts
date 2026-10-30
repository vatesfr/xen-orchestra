import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { omit } from 'lodash-es'
import { useI18n } from 'vue-i18n'

// "is empty" / "is not empty" are removed because they treat -1 (no VLAN) as set and 0 as empty
export function useVlanSchema(): PropertyDefinition {
  const { t } = useI18n()

  const { label, operators } = useNumberSchema(t('vlan'))

  return { label, operators: omit(operators, ['isEmpty', 'isNotEmpty']) }
}
