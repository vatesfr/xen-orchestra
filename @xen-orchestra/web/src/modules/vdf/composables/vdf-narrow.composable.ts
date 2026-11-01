import { type MaybeElementRef, useElementSize } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

// Whether a container is narrower than `rem` (root font size units): laptop
// widths, with XO's tree and a side panel open. Tables then drop or fold
// their low-priority columns rather than scroll sideways; what they drop
// stays one click away (side panel, details modal).
export function useVdfNarrow(target: MaybeElementRef, rem: number): ComputedRef<boolean> {
  const { width } = useElementSize(target)

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 10

  // unknown until measured: wide
  return computed(() => width.value > 0 && width.value < rem * rootFontSize)
}
