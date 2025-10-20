import { type VNode, defineAsyncComponent, h } from 'vue'
import {
  type TableCellRenderer,
  type TableCellVNode,
  type Extensions,
  applyExtensions,
  type ComponentLoader,
  type PropsOverride,
} from '..'

export function defineTableCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): TableCellRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderCell(renderConfig) {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props) satisfies VNode as TableCellVNode
  }
}
