import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { Extensions } from './extensions'
import type { HeaderRowVNode } from './header-row'
import type { VNode } from 'vue'

export type THeadVNode = Branded<'THeadVNode', VNode>

export type THeadRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    rows: () => HeaderRowVNode[]
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => THeadVNode
