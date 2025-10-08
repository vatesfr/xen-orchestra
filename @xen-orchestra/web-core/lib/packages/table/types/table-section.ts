import type { Branded } from '@core/types/utility.type'
import type { PropsOverride, Extensions, TableRowVNodes } from '.'
import type { VNode } from 'vue'

export type TableSectionVNode = Branded<'SectionVNode', VNode>

export type TableSectionVNodes = TableSectionVNode | TableSectionVNodes[]

export type TableSectionRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    rows: () => TableRowVNodes
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => TableSectionVNode
