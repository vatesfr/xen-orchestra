import type { Branded } from '@core/types/utility.type'
import type { PropsOverride } from '.'
import type { BodyCellVNode } from './body-cell'
import type { BodyRowVNode } from './body-row'
import type { Extensions } from './extensions'
import type { HeaderCellVNode } from './header-cell'
import type { HeaderRowVNode } from './header-row'
import type { TBodyVNode } from './tbody'
import type { THeadVNode } from './thead'
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
      | (() => THeadVNode)
      | { rows: () => HeaderRowVNode | (HeaderRowVNode | HeaderRowVNode[])[]; cells?: never }
      | { rows?: never; cells: () => HeaderCellVNode[] }
    tbody:
      | (() => TBodyVNode)
      | { rows: () => (BodyRowVNode | BodyRowVNode[])[]; cells?: never }
      | { rows?: never; cells: () => BodyCellVNode[][] }
  } & TPropsConfig
) => TableVNode
