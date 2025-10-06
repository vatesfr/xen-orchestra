import type { Status } from '@core/components/status/VtsStatus.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { icon } from '@core/icons'
import { defineColumns } from '@core/packages/table'
import { defineTable } from '@core/packages/table'
import { AddressBody, AddressHeader } from '@core/tables/definitions/columns/column-address'
import { NumberHeader, NumberBody } from '@core/tables/definitions/columns/column-number'
import { ObjectLinkHeader, ObjectLinkBody } from '@core/tables/definitions/columns/column-object-link'
import { SelectIdHeader, SelectIdBody } from '@core/tables/definitions/columns/column-select-id'
import { StatusHeader, StatusBody } from '@core/tables/definitions/columns/column-status'
import { TextHeader, TextBody } from '@core/tables/definitions/columns/column-text'
import { ValueHeader, ValueBody } from '@core/tables/definitions/columns/column-value'
import { DefaultRow } from '@core/tables/definitions/rows'
import { type StatefulConfig, DefaultTable } from '@core/tables/definitions/tables'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Pif = {
  id: string
  networkName: string
  management: boolean
  device: string
  status: Status
  vlan: string | number
  ips: string[]
  mac: string
  ipConfigurationMode: string
}

export const usePifsTable = defineTable((pifs: ComputedRef<Pif[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const selectedId = useRouteQuery('id')

  const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', pifs)

  const { getHeaderCells, getBodyCells } = defineColumns({
    network: {
      header: () => ObjectLinkHeader({ label: t('network') }),
      body: (pif: Pif) =>
        ObjectLinkBody({
          label: pif.networkName,
          icon: icon('fa:network-wired'),
          route: undefined,
          primary: pif.management ? t('management') : false,
        }),
    },
    device: {
      header: () => TextHeader({ label: t('device') }),
      body: pif => TextBody({ text: pif.device }),
    },
    status: {
      header: () => StatusHeader({ label: t('status') }),
      body: pif => StatusBody({ statuses: pif.status }),
    },
    vlan: {
      header: () => NumberHeader({ label: t('vlan') }),
      body: pif => NumberBody({ value: pif.vlan }),
    },
    ip: {
      header: () => AddressHeader({ label: t('ip-addresses') }),
      body: pif => AddressBody({ addresses: pif.ips }),
    },
    mac: {
      header: () => AddressHeader({ label: t('mac-address') }),
      body: pif => AddressBody({ addresses: pif.mac }),
    },
    mode: {
      header: () => ValueHeader({ label: t('ip-mode') }),
      body: pif => ValueBody({ value: pif.ipConfigurationMode }),
    },
    select: {
      header: () => SelectIdHeader({}),
      body: pif => SelectIdBody({ onSelect: () => (selectedId.value = pif.id) }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        paginated: paginationBindings,
        stateful: config,
        sticky: 'right',
      },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          paginatedPifs.value.map(pif =>
            DefaultRow({
              extensions: {
                selectable: { id: pif.id, selectedId },
              },
              key: pif.id,
              cells: () => getBodyCells(pif),
            })
          ),
      },
    })
})
