import { ifElse } from '@core/utils/if-else.utils.ts'
import { useLocalStorage, useRafFn, useStyleTag, useWindowSize } from '@vueuse/core'
import { computed, ref, type UnwrapRef } from 'vue'

const MIN_WIDTH = 280
const MAX_WIDTH_FLOOR = 400
const MAX_WIDTH_RATIO = 1 / 3
const DEFAULT_WIDTH_RATIO = 1 / 5

export type ResizableSide = 'left' | 'right'

export type ResizableWidth = UnwrapRef<ReturnType<typeof useResizableWidth>>

export function useResizableWidth(side: ResizableSide, storageKey: string) {
  const customWidth = useLocalStorage<number | null>(storageKey, null, {
    serializer: {
      read: value => {
        const width = Number.parseFloat(value)

        return Number.isFinite(width) ? width : null
      },
      write: value => String(value),
    },
  })

  const isResizing = ref(false)

  const { width: windowWidth } = useWindowSize()

  const maxWidth = computed(() => Math.max(MAX_WIDTH_FLOOR, windowWidth.value * MAX_WIDTH_RATIO))

  const defaultWidth = computed(() => Math.max(MIN_WIDTH, windowWidth.value * DEFAULT_WIDTH_RATIO))

  const width = computed(() => Math.min(maxWidth.value, customWidth.value ?? defaultWidth.value))

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

  function setWidth(value: number) {
    customWidth.value = Math.min(maxWidth.value, Math.max(MIN_WIDTH, value))
  }

  function resetWidth() {
    customWidth.value = null
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
    () => {
      if (clientX === initialX) {
        return
      }

      setWidth(resizeDelta())
    },
    { immediate: false }
  )

  ifElse(isResizing, [load, resume], [pause, unload])

  return {
    width,
    minWidth: MIN_WIDTH,
    maxWidth,
    startResize,
    setWidth,
    resetWidth,
    isResizing,
  }
}
