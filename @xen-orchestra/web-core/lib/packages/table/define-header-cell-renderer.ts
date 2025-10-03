import type { ComponentLoader, PropsOverride } from './types'
import type { Extensions } from './types/extensions'
import type { HeaderCellRenderer, HeaderCellVNode } from './types/header-cell'
import { defineAsyncComponent, h, type VNode } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineHeaderCellRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): HeaderCellRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderHeaderCell(renderConfig) {
    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props) satisfies VNode as HeaderCellVNode
  }
}
