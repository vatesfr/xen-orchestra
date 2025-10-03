import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { Extensions } from './extensions'
import type { VNode } from 'vue'

export type HeaderCellVNode = Branded<'HeaderCellVNode', VNode>

export type HeaderCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => HeaderCellVNode
