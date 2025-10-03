import { defineColumns, defineTable } from '@core/packages/table'
import { AddressHeader } from '@core/tables/definitions/columns/column-address'
import { ButtonBody } from '@core/tables/definitions/columns/column-button'
import { ButtonIconBody } from '@core/tables/definitions/columns/column-button-icon'
import { InputBody } from '@core/tables/definitions/columns/column-input'
import { SelectBody } from '@core/tables/definitions/columns/column-select'
import { TextHeader } from '@core/tables/definitions/columns/column-text'
import { ValueHeader } from '@core/tables/definitions/columns/column-value'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable } from '@core/tables/definitions/tables'
import { toRef, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewVmVif = {
  id: string
  network: string
  mac: string
}

export type NewVmNetwork = {
  id: string
  name_label: string
}

export const useNewVmNetworkTable = defineTable(
  (
    vifs: ComputedRef<NewVmVif[]>,
    config: { networks: ComputedRef<NewVmNetwork[]>; handleAdd: () => void; handleDelete: (index: number) => void }
  ) => {
    const { t } = useI18n()

    const { getHeaderCells, getBodyCells, visibleColumnsCount } = defineColumns({
      interfaces: {
        header: () => ValueHeader({ label: t('interfaces'), props: { icon: 'fa:network-wired' } }),
        body: (vif: NewVmVif) =>
          SelectBody({
            selectModel: toRef(vif, 'network'),
            selectOptions: config.networks.value.map(network => ({
              id: network.id,
              label: network.name_label,
              value: network.id,
            })),
          }),
      },
      mac: {
        header: () => AddressHeader({ label: t('mac-addresses') }),
        body: vif =>
          InputBody({
            inputModel: toRef(vif, 'mac'),
            placeholder: t('auto-generated'),
          }),
      },
      remove: {
        header: () => TextHeader({ label: '', props: { icon: undefined } }),
        body: (_, index: number) =>
          ButtonIconBody({
            icon: 'fa:trash',
            handler: () => config.handleDelete(index),
          }),
      },
    })

    return () =>
      DefaultTable({
        thead: { cells: getHeaderCells },
        tbody: {
          rows: () => [
            vifs.value.map((vif, index) =>
              DefaultRow({
                key: vif.id,
                cells: () => getBodyCells(vif, index),
              })
            ),
            DefaultRow({
              key: 'add',
              cells: () =>
                ButtonBody({
                  label: t('new'),
                  icon: 'fa:plus',
                  handler: config.handleAdd,
                  props: { colspan: visibleColumnsCount.value },
                  variant: 'tertiary',
                }),
            }),
          ],
        },
      })
  }
)
