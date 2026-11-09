import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVbd } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVbdSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVbd>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    attached: useBooleanSchema(t('status'), {
      true: t('connected'),
      false: t('disconnected'),
    }),
    bootable: useBooleanSchema(t('bootable'), {
      true: t('yes'),
      false: t('no'),
    }),
    read_only: useBooleanSchema(t('read-only'), {
      true: t('yes'),
      false: t('no'),
    }),
    VM: useStringSchema(t('vm')),
    VDI: useStringSchema(t('vdi')),
    $pool: useStringSchema(t('pool')),
  })
}
