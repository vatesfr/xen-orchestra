import type { ComponentLoader, PropsOverride } from './types'
import type { BodyRowRenderer, BodyRowVNode } from './types/body-row'
import type { Extensions } from './types/extensions'
import { type VNode, defineAsyncComponent, h } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineBodyRowRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): BodyRowRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderBodyRow(renderConfig): BodyRowVNode {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, {
      default: () => renderConfig.cells(),
    }) satisfies VNode as BodyRowVNode
  }
}
