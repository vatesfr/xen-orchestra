import type { Branded } from '@core/types/utility.type'
import type {
  TableCellVNodes,
  PropsOverride,
  TableRowVNodes,
  TableSectionVNode,
  TableSectionVNodes,
  Extensions,
} from '.'
import type { VNode } from 'vue'

export type TableVNode = Branded<'TableVNode', VNode>

export type TableRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    props?: PropsOverride<TComponentProps>
    thead:
      | (() => TableSectionVNode)
      | { rows: () => TableRowVNodes; cells?: never }
      | { rows?: never; cells: () => TableCellVNodes }
    tbody: (() => TableSectionVNodes) | { rows: () => TableRowVNodes }
  } & TPropsConfig
) => TableVNode
