import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { Extensions } from './extensions'
import type { VNode } from 'vue'

export type BodyCellVNode = Branded<'BodyCellVNode', VNode>

export type BodyCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => BodyCellVNode
