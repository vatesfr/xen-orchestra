import type { ComponentLoader, PropsOverride } from './types'
import type { BodyCellRenderer, BodyCellVNode } from './types/body-cell'
import type { Extensions } from './types/extensions'
import { defineAsyncComponent, h, type VNode } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineBodyCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): BodyCellRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderBodyCell(renderConfig) {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props) satisfies VNode as BodyCellVNode
  }
}
