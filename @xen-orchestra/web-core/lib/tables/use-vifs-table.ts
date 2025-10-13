import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { type IconName } from '@core/icons'
import { defineColumns } from '@core/packages/table'
import { defineTable } from '@core/packages/table'
import { AddressHeader, AddressBody } from '@core/tables/definitions/columns/column-address'
import { NumberHeader, NumberBody } from '@core/tables/definitions/columns/column-number'
import { ObjectLinkHeader, ObjectLinkBody } from '@core/tables/definitions/columns/column-object-link'
import { SelectIdHeader, SelectIdBody } from '@core/tables/definitions/columns/column-select-id'
import { StatusHeader, StatusBody } from '@core/tables/definitions/columns/column-status'
import { TextHeader, TextBody } from '@core/tables/definitions/columns/column-text'
import { ValueHeader, ValueBody } from '@core/tables/definitions/columns/column-value'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type Vif = {
  id: string
  networkName: string
  networkIcon: IconName
  device: string
  status: 'connected' | 'disconnected'
  ip: string[]
  MAC: string
  MTU: number
  lockingMode: string
}

export const useVifsTable = defineTable((vifs: ComputedRef<Vif[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const selectedVifId = useRouteQuery('id')

  const { getHeaderCells, getBodyCells } = defineColumns({
    network: {
      header: () => ObjectLinkHeader({ label: t('network') }),
      body: (vif: Vif) => ObjectLinkBody({ label: vif.networkName, icon: vif.networkIcon }),
    },
    device: {
      header: () => TextHeader({ label: t('device') }),
      body: vif => TextBody({ text: vif.device }),
    },
    status: {
      header: () => StatusHeader({ label: t('status') }),
      body: vif => StatusBody({ statuses: vif.status }),
    },
    ip: {
      header: () => AddressHeader({ label: t('ip-addresses') }),
      body: vif => AddressBody({ addresses: vif.ip }),
    },
    mac: {
      header: () => AddressHeader({ label: t('mac-addresses') }),
      body: vif => AddressBody({ addresses: vif.MAC }),
    },
    mtu: {
      header: () => NumberHeader({ label: t('mtu') }),
      body: vif => NumberBody({ value: vif.MTU }),
    },
    lockingMode: {
      header: () => ValueHeader({ label: t('locking-mode') }),
      body: vif => ValueBody({ value: vif.lockingMode }),
    },
    select: {
      header: () => SelectIdHeader({}),
      body: vif => SelectIdBody({ onSelect: () => (selectedVifId.value = vif.id) }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        sticky: 'right',
        stateful: config,
      },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          vifs.value.map(vif =>
            DefaultRow({
              extensions: {
                selectable: {
                  id: vif.id,
                  selectedId: selectedVifId,
                },
              },
              key: vif.id,
              cells: () => getBodyCells(vif),
            })
          ),
      },
    })
})
