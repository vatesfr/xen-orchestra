import { defineColumns } from '@core/packages/table'
import { defineTable } from '@core/packages/table'
import { NumberHeader, NumberBody } from '@core/tables/definitions/columns/column-number'
import { TextHeader, TextBody } from '@core/tables/definitions/columns/column-text'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import { type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Patch = { name: string; version?: string; date?: string }

export const usePatchesTable = defineTable((patches: ComputedRef<Patch[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const { getHeaderCells, getBodyCells } = defineColumns({
    name: {
      header: () => TextHeader({ label: t('name') }),
      body: (patch: Patch) => TextBody({ text: patch.name }),
    },
    version: {
      header: () => NumberHeader({ label: t('version') }),
      body: patch => NumberBody({ value: patch.version ?? '' }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        stateful: config,
      },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          patches.value.map(patch =>
            DefaultRow({
              key: `${patch.name}-${patch.version ?? patch.date}`,
              cells: () => getBodyCells(patch),
            })
          ),
      },
    })
})
