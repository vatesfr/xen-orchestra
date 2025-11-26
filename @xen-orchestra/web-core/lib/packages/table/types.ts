import type { VNode } from 'vue'

export type ColumnRenderer<THeadArgs extends any[], TBodyArgs extends any[]> = {
  renderHead: (...args: THeadArgs) => VNode
  renderBody: (...args: TBodyArgs) => VNode
}

export type Columns = Record<string, ColumnRenderer<any, any>>
