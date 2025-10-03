import { defineColumns, defineMultiSourceTable } from '@core/packages/table'
import { ButtonBody } from '@core/tables/definitions/columns/column-button'
import { ButtonIconBody } from '@core/tables/definitions/columns/column-button-icon'
import { InputBody } from '@core/tables/definitions/columns/column-input'
import { SelectBody } from '@core/tables/definitions/columns/column-select'
import { TextHeader, TextBody } from '@core/tables/definitions/columns/column-text'
import { ValueHeader } from '@core/tables/definitions/columns/column-value'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable } from '@core/tables/definitions/tables'
import { toRef, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewVmVdi = {
  sr: string | undefined
  name_label: string
  name_description: string
  size: number
}

export type NewVmSr = {
  id: string
  name_label: string
}

type GetBodyData = { exists: boolean; index: number }

export const useNewVmSrTable = defineMultiSourceTable(
  (
    { existingVdis, newVdis }: { existingVdis: ComputedRef<NewVmVdi[]>; newVdis: ComputedRef<NewVmVdi[]> },
    config: { srs: ComputedRef<NewVmSr[]>; handleAdd: () => void; handleDelete: (index: number) => void }
  ) => {
    const { t } = useI18n()

    const { getHeaderCells, getBodyCells, visibleColumnsCount } = defineColumns({
      sr: {
        header: () => ValueHeader({ label: t('storage-repositories'), props: { icon: 'fa:database' } }),
        body: (vdi: NewVmVdi) =>
          SelectBody({
            selectModel: toRef(vdi, 'sr'),
            selectOptions: config.srs.value.map(sr => ({
              id: sr.id,
              label: sr.name_label,
              value: sr.id,
            })),
          }),
      },
      diskName: {
        header: () => TextHeader({ label: t('disk-name') }),
        body: vdi => InputBody({ inputModel: toRef(vdi, 'name_label'), placeholder: t('disk-name') }),
      },
      memory: {
        header: () => ValueHeader({ label: `${t('size')} (GB)`, props: { icon: 'fa:memory' } }),
        body: (vdi, data: GetBodyData) =>
          InputBody({ inputModel: toRef(vdi, 'size'), type: 'number', placeholder: t('size'), disabled: data.exists }),
      },
      description: {
        header: () => TextHeader({ label: t('description') }),
        body: vdi => InputBody({ inputModel: toRef(vdi, 'name_description'), placeholder: t('description') }),
      },
      remove: {
        header: () => TextHeader({ label: '', props: { icon: undefined } }),
        body: (vdi, data) =>
          data.exists
            ? TextBody({ text: '' })
            : ButtonIconBody({
                icon: 'fa:trash',
                handler: () => config.handleDelete(data.index),
              }),
      },
    })

    return () =>
      DefaultTable({
        thead: { cells: getHeaderCells },
        tbody: {
          rows: () => [
            existingVdis.value.map((vdi, index) =>
              DefaultRow({
                key: index,
                cells: () => getBodyCells(vdi, { exists: true, index }),
              })
            ),
            newVdis.value.map((vdi, index) =>
              DefaultRow({
                key: index,
                cells: () => getBodyCells(vdi, { exists: false, index }),
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
