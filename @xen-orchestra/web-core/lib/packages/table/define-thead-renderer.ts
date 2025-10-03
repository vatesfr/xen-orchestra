import type { ComponentLoader, PropsOverride } from './types'
import type { Extensions } from './types/extensions'
import type { THeadRenderer, THeadVNode } from './types/thead'
import { type VNode, defineAsyncComponent, h } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineTHeadRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): THeadRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderTHead(renderConfig) {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.rows(),
    }) satisfies VNode as THeadVNode
  }
}
