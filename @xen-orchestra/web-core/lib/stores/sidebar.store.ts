import { useUiStore } from '@core/stores/ui.store'
import { ifElse } from '@core/utils/if-else.utils'
import { useLocalStorage, useRafFn, useStyleTag, useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useSidebarStore = defineStore('layout', () => {
  const uiStore = useUiStore()
  const isExpanded = useLocalStorage('sidebar.expanded', true)
  const isLocked = useLocalStorage('sidebar.locked', true)
  const width = useLocalStorage('sidebar.width', 350)
  const toggleExpand = useToggle(isExpanded)
  const toggleLock = useToggle(isLocked)
  const isResizing = ref(false)
  let desktopState = false

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

  const cssWidth = computed(() => (uiStore.isMobile ? '100%' : `${width.value}px`))

  const cssOffset = computed(() => (isExpanded.value ? 0 : `-${cssWidth.value}`))

  const { load, unload } = useStyleTag('body { cursor: col-resize !important; }', { immediate: false })

  const { pause, resume } = useRafFn(
    () => (width.value = Math.min(500, Math.max(200, initialWidth + clientX - initialX))),
    { immediate: false }
  )

  ifElse(isResizing, [load, resume], [pause, unload])

  watch(
    () => uiStore.isMobile,
    isMobile => {
      // keep the state of desktop expansion
      if (isMobile) {
        desktopState = isExpanded.value
      }

      isExpanded.value = desktopState && !isMobile
    }
  )

  return {
    isExpanded,
    isLocked,
    width,
    toggleExpand,
    toggleLock,
    startResize,
    isResizing,
    cssWidth,
    cssOffset,
  }
})
