import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { BodyCellVNode } from './body-cell'
import type { Extensions } from './extensions'
import type { VNode } from 'vue'

export type BodyRowVNode = Branded<'BodyRowVNode', VNode>

export type BodyRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> = (
  renderConfig: {
    extensions?: { [K in keyof TExtensions]?: Parameters<TExtensions[K]>[0] }
    key: string | number
    props?: PropsOverride<TComponentProps>
    cells: () => BodyCellVNode | BodyCellVNode[]
  } & TPropsConfig
) => BodyRowVNode
