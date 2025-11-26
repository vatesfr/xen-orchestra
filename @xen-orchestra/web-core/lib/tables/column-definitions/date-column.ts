import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

type AcceptableDate = Date | string | number

export const useDateColumn = defineColumn(
  (config?: HeaderConfig & Pick<Intl.DateTimeFormatOptions, 'dateStyle' | 'timeStyle'>) => {
    const { d } = useI18n()

    return {
      renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:calendar', config?.headerLabel),
      renderBody: (date?: AcceptableDate, options?: { relative?: boolean }) => {
        return renderUiTableCell(() => {
          if (date === undefined) {
            return undefined
          }

          if (options?.relative) {
            return h(VtsRelativeTime, { date })
          }

          return d(date, {
            dateStyle: config?.dateStyle,
            timeStyle: config?.timeStyle,
          })
        })
      },
    }
  }
)
