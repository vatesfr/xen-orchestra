import { type VNode, defineAsyncComponent, h } from 'vue'
import {
  applyExtensions,
  type TableSectionRenderer,
  type TableSectionVNode,
  type Extensions,
  type ComponentLoader,
  type PropsOverride,
} from '..'

export function defineSectionRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): TableSectionRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderSection(renderConfig): TableSectionVNode {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.rows(),
    }) satisfies VNode as TableSectionVNode
  }
}
