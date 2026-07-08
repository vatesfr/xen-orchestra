import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useServerColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    pool: useLinkColumn({ headerLabel: () => t('pool') }),
    hostIp: useAddressColumn({ headerLabel: () => t('ip-address') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    primaryHost: useLinkColumn({ headerLabel: () => t('master') }),
    selectItem: useActionColumn({}),
  }
})
