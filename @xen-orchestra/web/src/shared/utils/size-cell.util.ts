import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { VNode } from 'vue'

// A number cell shows a size and its unit apart
export function renderSizeCell(bytes: number, renderer: (value: number, unit: string) => VNode): VNode {
  const { value, prefix } = formatSizeRaw(bytes, 1)

  return renderer(value, prefix)
}
