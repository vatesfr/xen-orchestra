import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { DateLike } from '@vueuse/shared'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

type DateConfig = Pick<Intl.DateTimeFormatOptions, 'dateStyle' | 'timeStyle'>

export const useDateColumn = defineColumn((config?: HeaderConfig & DateConfig) => {
  const { d } = useI18n()

  return {
    renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:calendar', config?.headerLabel),
    renderBody: (date?: DateLike, options?: { relative?: boolean }) => {
      return renderBodyCell(() => {
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
})
