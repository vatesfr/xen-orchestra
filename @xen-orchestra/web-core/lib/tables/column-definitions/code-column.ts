import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

/**
 * A monospace value (e.g. an image reference), truncated with a tooltip
 * beyond `30rem`
 */
export const useCodeColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (content: string | undefined) =>
    renderBodyCell(() =>
      content === undefined || content === '' ? undefined : h(VtsCodeSnippet, { content, style: { maxWidth: '30rem' } })
    ),
}))
