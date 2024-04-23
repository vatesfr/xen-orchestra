import { useUiStore } from '@core/stores/ui.store'
import { ifElse } from '@core/utils/if-else.utils'
import { useLocalStorage, useRafFn, useStyleTag, useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useSidebarStore = defineStore('layout', () => {
  const uiStore = useUiStore()
  const isExpanded = useLocalStorage('sidebar.expanded', true)
  const isPinned = useLocalStorage('sidebar.pinned', true)
  const width = useLocalStorage('sidebar.width', 350)
  const toggleExpand = useToggle(isExpanded)
  const togglePin = useToggle(isPinned)
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

  const cssWidth = computed(() => (uiStore.isMobile ? '100%' : `${width.value}px`))

  const cssOffset = computed(() => (isExpanded.value ? 0 : uiStore.isMobile ? '-100%' : `-${width.value}px`))

  const { load, unload } = useStyleTag('body { cursor: col-resize !important; }', { immediate: false })

  const { pause, resume } = useRafFn(
    () => (width.value = Math.min(500, Math.max(200, initialWidth + clientX - initialX))),
    { immediate: false }
  )

  ifElse(isResizing, [load, resume], [pause, unload])

  return {
    isExpanded,
    isPinned,
    width,
    toggleExpand,
    togglePin,
    startResize,
    isResizing,
    cssWidth,
    cssOffset,
  }
})
