import type { SidebarSide } from '@core/packages/sidebar/types.ts'
import { ifElse } from '@core/utils/if-else.utils.ts'
import { useRafFn, useStyleTag } from '@vueuse/core'
import { ref, type Ref } from 'vue'

export function useSidebarResize(side: SidebarSide, width: Ref<number>) {
  const isResizing = ref(false)

  let initialX: number
  let initialWidth: number
  let clientX: number

  function startResize(event: MouseEvent) {
    clientX = event.clientX
    initialX = clientX
    initialWidth = width.value
    isResizing.value = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(event: MouseEvent) {
    clientX = event.clientX
  }

  function handleMouseUp() {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const { load, unload } = useStyleTag('body { cursor: col-resize !important; }', { immediate: false })

  const resizeDelta = () => (side === 'left' ? initialWidth + clientX - initialX : initialWidth + initialX - clientX)

  const { pause, resume } = useRafFn(
    () => (width.value = Math.min(Math.min(500, window.innerWidth * 0.3), Math.max(200, resizeDelta()))),
    { immediate: false }
  )

  ifElse(isResizing, [load, resume], [pause, unload])

  return {
    startResize,
    isResizing,
  }
}
