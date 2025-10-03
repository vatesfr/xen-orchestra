import type { ComponentLoader, PropsOverride } from './types'
import type { Extensions } from './types/extensions'
import type { HeaderRowRenderer, HeaderRowVNode } from './types/header-row'
import { type VNode, defineAsyncComponent, h } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineHeaderRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): HeaderRowRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderRow(renderConfig): HeaderRowVNode {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.cells(),
    }) satisfies VNode as HeaderRowVNode
  }
}
