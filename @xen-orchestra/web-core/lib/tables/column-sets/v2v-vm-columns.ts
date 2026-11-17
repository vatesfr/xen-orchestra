import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useCollapsedListColumn } from '@core/tables/column-definitions/collapsed-list-column.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

function setupV2vVmColumns() {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    vm: useTextColumn({ headerLabel: () => t('vm') }),
    power: useTextColumn({ headerLabel: () => t('power-state') }),
    datastores: useTextColumn({ headerLabel: () => t('datastores') }),
    alsoOn: useCollapsedListColumn({ headerLabel: () => t('also-on') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    sizeOnDatastore: useNumberColumn({ headerLabel: () => t('size-on-this-datastore') }),
    migration: useTagColumn({ headerLabel: () => t('migration') }),
    lastSync: useDateColumn({ headerLabel: () => t('last-sync') }),
  }
}

// Exported because the V2V table shares body renderers between its two views, outside a `body` callback
export type V2vVmColumns = ReturnType<typeof setupV2vVmColumns>

export const useV2vVmColumns = defineColumns(setupV2vVmColumns)
