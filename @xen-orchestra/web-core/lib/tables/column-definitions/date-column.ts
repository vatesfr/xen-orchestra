import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import type { DateLike } from '@vueuse/shared'
import { h } from 'vue'

export const useDateColumn = defineColumn((config?: HeaderConfig) => {
  return {
    renderHead: () => renderHeadCell(config?.headerLabel),
    renderBody: (date?: DateLike, options?: { relative?: boolean }) => {
      return renderBodyCell(() => {
        if (date === undefined) {
          return undefined
        }

        if (options?.relative) {
          return h(VtsRelativeTime, { date })
        }

        return formatDateTime(date)
      }, 'end')
    },
  }
})
