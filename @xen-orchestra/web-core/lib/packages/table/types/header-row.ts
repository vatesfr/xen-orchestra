import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { Extensions } from './extensions'
import type { HeaderCellVNode } from './header-cell'
import type { VNode } from 'vue'

export type HeaderRowVNode = Branded<'HeaderRowVNode', VNode>

export type HeaderRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    key: string | number
    props?: PropsOverride<TComponentProps>
    cells: () => HeaderCellVNode[]
  } & TPropsConfig
) => HeaderRowVNode
