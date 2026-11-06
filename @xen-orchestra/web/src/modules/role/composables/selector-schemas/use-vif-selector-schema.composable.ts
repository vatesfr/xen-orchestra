import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { VIF_LOCKING_MODE, type XoVif } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVifSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVif>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    device: useStringSchema(t('device')),
    MAC: useStringSchema(t('mac-address')),
    attached: useBooleanSchema(t('status'), {
      true: t('connected'),
      false: t('disconnected'),
    }),
    lockingMode: useStringSchema(t('locking-mode'), {
      [VIF_LOCKING_MODE.DISABLED]: t('disabled'),
      [VIF_LOCKING_MODE.LOCKED]: t('locked'),
      [VIF_LOCKING_MODE.NETWORK_DEFAULT]: t('default-locking-mode'),
      [VIF_LOCKING_MODE.UNLOCKED]: t('unlocked'),
    }),
    $VM: useStringSchema(t('vm')),
    $network: useStringSchema(t('network')),
    $pool: useStringSchema(t('pool')),
  })
}
