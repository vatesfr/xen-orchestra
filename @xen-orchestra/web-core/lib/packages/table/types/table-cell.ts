import type { Branded } from '@core/types/utility.type'
import type { PropsOverride, Extensions } from '.'
import type { VNode } from 'vue'

export type TableCellVNode = Branded<'CellVNode', VNode>

export type TableCellVNodes = TableCellVNode | TableCellVNodes[]

export type TableCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => TableCellVNode
