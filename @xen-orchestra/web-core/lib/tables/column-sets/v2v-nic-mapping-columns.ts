import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useV2vNicMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    adapter: useTextColumn({ headerLabel: () => t('adapter'), flexible: true }),
    portGroup: useTextColumn({ headerLabel: () => t('port-group') }),
    mac: useTextColumn({ headerLabel: () => t('mac-address') }),
    target: useTextColumn({ headerLabel: () => t('target-network') }),
    origin: useTextColumn({ headerLabel: () => t('value-from') }),
  }
})
