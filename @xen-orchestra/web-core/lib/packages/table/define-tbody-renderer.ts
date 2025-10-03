import type { ComponentLoader, PropsOverride } from './types'
import type { Extensions } from './types/extensions'
import type { TBodyRenderer, TBodyVNode } from './types/tbody'
import { type VNode, defineAsyncComponent, h } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineTBodyRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): TBodyRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderTBody(renderConfig) {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.rows(),
    }) satisfies VNode as TBodyVNode
  }
}
