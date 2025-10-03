import { usePagination } from '@core/composables/pagination.composable'
import { objectIcon } from '@core/icons/index.ts'
import { defineColumns } from '@core/packages/table'
import { defineTable } from '@core/packages/table'
import { ObjectLinkBody, ObjectLinkHeader } from '@core/tables/definitions/columns/column-object-link'
import { TextBody, TextHeader } from '@core/tables/definitions/columns/column-text'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import { toLower } from 'lodash-es'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type Vm = {
  id: string
  name_label: string
  name_description: string
  power_state: 'Halted' | 'Paused' | 'Running' | 'Suspended'
}

export const usePoolVmsTable = defineTable((vms: ComputedRef<Vm[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const { getHeaderCells, getBodyCells } = defineColumns({
    name: {
      header: () => ObjectLinkHeader({ label: t('vm') }),
      body: (vm: Vm) =>
        ObjectLinkBody({
          label: vm.name_label,
          icon: objectIcon('vm', toLower(vm.power_state)),
          route: `/vm/${vm.id}`,
        }),
    },
    description: {
      header: () => TextHeader({ label: t('vm-description') }),
      body: vm => TextBody({ text: vm.name_description }),
    },
  })

  const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', vms)

  return () =>
    DefaultTable({
      extensions: {
        stateful: config,
        paginated: paginationBindings,
      },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          paginatedVms.value.map(vm =>
            DefaultRow({
              key: vm.id,
              cells: () => getBodyCells(vm),
            })
          ),
      },
    })
})
