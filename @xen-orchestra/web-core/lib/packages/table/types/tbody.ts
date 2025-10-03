import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { BodyRowVNode } from './body-row'
import type { Extensions } from './extensions'
import type { VNode } from 'vue'

export type TBodyVNode = Branded<'TBodyVNode', VNode>

export type TBodyRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    rows: () => BodyRowVNode[]
    props?: PropsOverride<TComponentProps>
  } & TPropsConfig
) => TBodyVNode
