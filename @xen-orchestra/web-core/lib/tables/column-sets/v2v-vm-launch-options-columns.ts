import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useV2vVmLaunchOptionsColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useTextColumn({ headerLabel: () => t('vm') }),
    stopSource: useTextColumn({ headerLabel: () => t('v2v:stop-source') }),
    docking: useTextColumn({ headerLabel: () => t('v2v:docking') }),
    startVm: useTextColumn({ headerLabel: () => t('v2v:start-on-xcp-ng') }),
  }
})
