import type { VirtualElement } from '@floating-ui/vue'
import { type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

export type UsePinnedAnchorOptions = {
  reference: MaybeRefOrGetter<HTMLElement | undefined>
  container: MaybeRefOrGetter<HTMLElement | null | undefined>
  isPinned: MaybeRefOrGetter<boolean>
}

export function usePinnedAnchor(options: UsePinnedAnchorOptions) {
  const anchor = shallowRef<VirtualElement>()

  function pin() {
    const reference = toValue(options.reference)
    const container = toValue(options.container)

    if (reference === undefined || !container) {
      anchor.value = undefined
      return
    }

    const referenceRect = reference.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const offsetX = referenceRect.x - containerRect.x
    const offsetY = referenceRect.y - containerRect.y

    anchor.value = {
      contextElement: reference,
      getBoundingClientRect: () => {
        const { x, y } = container.getBoundingClientRect()

        return new DOMRect(x + offsetX, y + offsetY, referenceRect.width, referenceRect.height)
      },
    }
  }

  watch(
    () => toValue(options.isPinned),
    isPinned => {
      if (isPinned) {
        pin()
        return
      }

      anchor.value = undefined
    },
    { immediate: true }
  )

  return anchor
}
