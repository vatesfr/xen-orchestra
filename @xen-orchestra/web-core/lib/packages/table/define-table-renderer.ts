import type { ComponentLoader, PropsOverride } from './types'
import type { Extensions } from './types/extensions'
import type { TableRenderer, TableVNode } from './types/table'
import { type VNode, defineAsyncComponent, h } from 'vue'
import { applyExtensions } from './apply-extensions'

export function defineTableRenderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
>(config: {
  component: ComponentLoader<TComponentProps>
  props?: (config: TPropsConfig) => PropsOverride<TComponentProps>
  extensions?: TExtensions
}): TableRenderer<TComponentProps, TExtensions, TPropsConfig> {
  const component = defineAsyncComponent(config.component)

  return function RenderTable(renderConfig) {
    const { thead, tbody } = renderConfig

    const renderThead =
      typeof thead === 'function'
        ? thead
        : 'cells' in thead && thead.cells
          ? () => h('thead', {}, h('tr', {}, { default: () => thead.cells() }))
          : 'rows' in thead && thead.rows
            ? () => h('thead', {}, { default: () => thead.rows() })
            : () => undefined

    const renderTbody =
      typeof tbody === 'function'
        ? tbody
        : 'cells' in tbody && tbody.cells
          ? () =>
              h(
                'tbody',
                {},
                tbody.cells().map(cells => h('tr', {}, cells))
              )
          : 'rows' in tbody && tbody.rows
            ? () => h('tbody', {}, { default: () => tbody.rows() })
            : () => undefined

    const extension = applyExtensions(config, renderConfig)

    return h(component, extension.props, () => {
      return [renderThead(), renderTbody()]
    }) satisfies VNode as TableVNode
  }
}
