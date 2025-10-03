import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { icon, type IconName } from '@core/icons'
import { defineTable, defineColumns } from '@core/packages/table'
import { AddressHeader, AddressBody } from '@core/tables/definitions/columns/column-address'
import { ObjectLinkBody, ObjectLinkHeader } from '@core/tables/definitions/columns/column-object-link'
import { SelectIdHeader, SelectIdBody } from '@core/tables/definitions/columns/column-select-id'
import { StatusBody, StatusHeader } from '@core/tables/definitions/columns/column-status'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import { type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Server = {
  id: string
  label: string
  route: string | undefined
  icon: IconName | undefined
  host: string
  status: 'connected' | 'disconnected' | 'connecting' | 'unable-to-connect-to-the-pool'
  primaryHost: { label: string; route: string } | undefined
}

export const useServerTable = defineTable((servers: ComputedRef<Server[]>, config: StatefulConfig) => {
  const { t } = useI18n()
  const selectedId = useRouteQuery('id')

  const { pageRecords: paginatedServers, paginationBindings } = usePagination('pools', servers)

  const { getBodyCells, getHeaderCells } = defineColumns({
    label: {
      header: () => ObjectLinkHeader({ label: t('pool') }),
      body: (server: Server) =>
        ObjectLinkBody({
          label: server.label,
          route: server.route,
          icon: server.icon,
        }),
    },
    host: {
      header: () => AddressHeader({ label: t('ip-address') }),
      body: server => AddressBody({ addresses: server.host }),
    },
    status: {
      header: () => StatusHeader({ label: t('status') }),
      body: server => StatusBody({ statuses: server.status }),
    },
    primaryHost: {
      header: () => ObjectLinkHeader({ label: t('master'), props: { icon: icon('fa:server') } }),
      body: server =>
        ObjectLinkBody({
          label: server.primaryHost?.label ?? '',
          route: server.primaryHost?.route,
          icon: server.primaryHost ? 'fa:server' : undefined,
        }),
    },
    select: {
      header: () => SelectIdHeader({}),
      body: server =>
        SelectIdBody({
          onSelect: () => {
            selectedId.value = server.id
          },
        }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        stateful: config,
        sticky: 'right',
        paginated: paginationBindings,
      },

      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          paginatedServers.value.map(server =>
            DefaultRow({
              extensions: {
                selectable: {
                  id: server.id,
                  selectedId,
                },
              },
              key: server.id,
              cells: () => getBodyCells(server),
            })
          ),
      },
    })
})
