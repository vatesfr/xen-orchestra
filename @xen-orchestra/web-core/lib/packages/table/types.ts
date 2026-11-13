import type { ComputedRef, VNode } from 'vue'

export type ColumnRenderer<THeadArgs extends any[], TBodyArgs extends any[]> = {
  renderHead: (...args: THeadArgs) => VNode
  renderBody: (...args: TBodyArgs) => VNode
}

export type Columns = Record<string, ColumnRenderer<any, any>>

export type ColumnSortDirection = 'asc' | 'desc'

export type ColumnSortContext = {
  direction: ComputedRef<ColumnSortDirection | undefined>
  setDirection: (direction: ColumnSortDirection) => void
}

export type AreAllPropertiesOptional<T> = Record<string, never> extends T ? true : false
