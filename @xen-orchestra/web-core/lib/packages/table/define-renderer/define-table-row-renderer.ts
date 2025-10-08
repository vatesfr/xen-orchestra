import { type VNode, defineAsyncComponent, h } from 'vue'
import {
  applyExtensions,
  type TableRowRenderer,
  type TableRowVNode,
  type Extensions,
  type ComponentLoader,
  type PropsOverride,
} from '..'

export function defineRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): TableRowRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderRow(renderConfig): TableRowVNode {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.cells(),
    }) satisfies VNode as TableRowVNode
  }
}
