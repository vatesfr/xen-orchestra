import { useTooltipStore } from '@core/stores/tooltip.store.ts'
import { nextTick } from 'vue'

export async function findTooltipContent(element: Element) {
  // `trigger` ignores disabled elements
  element.dispatchEvent(new MouseEvent('mouseenter'))
  await nextTick()

  return useTooltipStore().tooltips.find(tooltip => tooltip.target === element)?.options.content
}
