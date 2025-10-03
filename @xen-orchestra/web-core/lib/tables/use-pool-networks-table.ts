import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { defineColumns, defineTypedTable } from '@core/packages/table'
import { NumberHeader, NumberBody } from '@core/tables/definitions/columns/column-number'
import { ObjectLinkHeader, ObjectLinkBody } from '@core/tables/definitions/columns/column-object-link'
import { SelectIdHeader, SelectIdBody } from '@core/tables/definitions/columns/column-select-id'
import { StatusHeader, StatusBody } from '@core/tables/definitions/columns/column-status'
import { TextHeader, TextBody } from '@core/tables/definitions/columns/column-text'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import { type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Network = {
  id: string
  name_label: string
  name_description: string
  MTU: number
  status: 'partially-connected' | 'connected' | 'disconnected'
  vlan: string
  lockingMode: string
}

type InternalNetwork = Omit<Network, 'status' | 'vlan'>

export const usePoolNetworksTable = defineTypedTable(
  (
    {
      type,
      data: networks,
    }: { type: 'default'; data: ComputedRef<Network[]> } | { type: 'internal'; data: ComputedRef<InternalNetwork[]> },
    config: StatefulConfig
  ) => {
    const { t } = useI18n()

    const selectedId = useRouteQuery('id')

    const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', networks)

    const { getHeaderCells, getBodyCells } = defineColumns({
      name: {
        header: () => ObjectLinkHeader({ label: t('name') }),
        body: (network: Network) => ObjectLinkBody({ label: network.name_label, icon: 'fa:network-wired' }),
      },
      description: {
        header: () => TextHeader({ label: t('description') }),
        body: network => TextBody({ text: network.name_description }),
      },
      status:
        type === 'internal'
          ? undefined
          : {
              header: () => StatusHeader({ label: t('status') }),
              body: network => StatusBody({ statuses: network.status }),
            },
      vlan:
        type === 'internal'
          ? undefined
          : {
              header: () => NumberHeader({ label: t('vlan') }),
              body: network => NumberBody({ value: network.vlan }),
            },
      mtu: {
        header: () => NumberHeader({ label: t('mtu') }),
        body: network => NumberBody({ value: network.MTU }),
      },
      defaultLockingMode: {
        header: () => TextHeader({ label: t('default-locking-mode') }),
        body: network => TextBody({ text: network.lockingMode }),
      },
      select: {
        header: () => SelectIdHeader({}),
        body: network => SelectIdBody({ onSelect: () => (selectedId.value = network.id) }),
      },
    })

    return () =>
      DefaultTable({
        extensions: {
          sticky: 'right',
          paginated: paginationBindings,
          stateful: config,
        },
        thead: { cells: getHeaderCells },
        tbody: {
          rows: () =>
            paginatedNetworks.value.map(network =>
              DefaultRow({
                extensions: {
                  selectable: {
                    id: network.id,
                    selectedId,
                  },
                },
                key: network.id,
                cells: () => getBodyCells(network as Network),
              })
            ),
        },
      })
  }
)
