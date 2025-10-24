import { usePagination } from '@core/composables/pagination.composable'
import { objectIcon } from '@core/icons'
import { defineColumns } from '@core/packages/table'
import { defineTable } from '@core/packages/table'
import { ObjectLinkBody, ObjectLinkHeader } from '@core/tables/definitions/columns/column-object-link'
import { TextBody, TextHeader } from '@core/tables/definitions/columns/column-text'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import { toLower } from 'lodash-es'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Host = {
  id: string
  name_label: string
  name_description: string
  power_state: 'Running' | 'Halted' | 'Unknown'
}
export const usePoolHostsTable = defineTable((hosts: ComputedRef<Host[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', hosts)

  const { getBodyCells, getHeaderCells } = defineColumns({
    name: {
      header: () => ObjectLinkHeader({ label: t('host') }),
      body: (host: Host) =>
        ObjectLinkBody({
          label: host.name_label,
          icon: objectIcon('host', toLower(host.power_state)),
          route: `/host/${host.id}`,
        }),
    },
    description: {
      header: () => TextHeader({ label: t('host-description') }),
      body: host => TextBody({ text: host.name_description }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        paginated: paginationBindings,
        stateful: config,
      },
      thead: {
        cells: getHeaderCells,
      },
      tbody: {
        rows: () => paginatedHosts.value.map(host => DefaultRow({ key: host.id, cells: () => getBodyCells(host) })),
      },
    })
})
