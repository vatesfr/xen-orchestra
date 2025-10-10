import type { Branded } from '@core/types/utility.type'
import type { PropsOverride, Extensions, TableCellVNodes } from '.'
import type { VNode } from 'vue'

export type TableRowVNode = Branded<'RowVNode', VNode>

export type TableRowVNodes = TableRowVNode | TableRowVNodes[]

export type TableRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    key: string | number
    props?: PropsOverride<TComponentProps>
    cells: () => TableCellVNodes
  } & TPropsConfig
) => TableRowVNode
