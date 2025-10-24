import type { Extensions } from '.'
import { mergeProps } from 'vue'

export function applyExtensions(
  config: {
    props?: (config: any) => Record<string, any>
    extensions?: Extensions<any>
  },
  renderConfig: {
    props?: Record<string, any>
    extensions?: Record<string, any>
  }
): { props: Record<string, any> } {
  const baseProps = mergeProps(config.props?.(renderConfig) ?? {}, renderConfig.props ?? {})

  if (!renderConfig.extensions) {
    return { props: baseProps }
  }

  const props = Object.entries(renderConfig.extensions).reduce(
    (props, [extName, extData]) => mergeProps(props, config.extensions?.[extName!](extData).props ?? {}),
    baseProps
  )

  return { props }
}
